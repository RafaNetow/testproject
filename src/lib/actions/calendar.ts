"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";
import { loadCalendarEvents } from "@/lib/calendar-events";
import { STUDIO_TIMEZONE, addDays, zonedLocalToUtc, type CalendarEvent } from "@/lib/calendar";
import { EVENT_COLORS } from "@/lib/calendar-floating";
import { createMeeting } from "@/lib/actions/meetings";

/**
 * The admin calendar's reads and writes. Times arrive as Copenhagen wall
 * times ("2026-10-28T10:30", what the dialogs and drag-and-drop produce) and
 * are stored as real instants. Every write requires the admin; own events are
 * further limited by RLS to their owner.
 */

export type CalendarResult = { ok: true } | { ok: false; message: string };

const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}

function when(instant: Date) {
  return instant.toLocaleString("en-GB", { timeZone: STUDIO_TIMEZONE, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Everything the calendar shows between two days (inclusive): portal items plus the admin's own events. */
export async function getCalendarRange(from: string, to: string): Promise<CalendarEvent[]> {
  await requireAxelAdmin();
  if (!DAY.test(from) || !DAY.test(to)) return [];
  const supabase = await createClient();
  const [items, { data: own }] = await Promise.all([
    loadCalendarEvents(supabase, { from, to, surface: "admin" }),
    supabase
      .from("calendar_events")
      .select("id, title, description, start_at, end_at, all_day, color")
      .lt("start_at", zonedLocalToUtc(`${addDays(to, 1)}T00:00`).toISOString())
      .gte("end_at", zonedLocalToUtc(`${from}T00:00`).toISOString()),
  ]);
  const events: CalendarEvent[] = (own ?? []).map((e) => ({
    id: `event:${e.id}`,
    kind: "event",
    title: e.title,
    description: e.description,
    // All-day events keep their days; timed ones their instants.
    start: e.all_day ? toDay(e.start_at) : e.start_at,
    end: e.all_day ? toDay(e.end_at) : e.end_at,
    allDay: e.all_day,
    status: "",
    href: null,
    context: "Only you see this",
    color: e.color,
  }));
  return [...items, ...events];
}

function toDay(instant: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TIMEZONE }).format(new Date(instant));
}

type OwnEventInput = { id?: string; title: string; description?: string; start: string; end: string; allDay: boolean; color: string };

/** Creates or updates one of the admin's own events. All-day events take days; timed ones Copenhagen wall times. */
export async function saveOwnEvent(input: OwnEventInput): Promise<CalendarResult> {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const title = input.title.trim();
  if (!title) return { ok: false, message: "Give the event a title." };
  if (!(input.color in EVENT_COLORS)) return { ok: false, message: "Pick one of the colours." };
  const range = rangeOf(input);
  if ("message" in range) return { ok: false, message: range.message };

  const supabase = await createClient();
  const row = {
    title,
    description: input.description?.trim() || null,
    start_at: range.start,
    end_at: range.end,
    all_day: input.allDay,
    color: input.color,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("calendar_events").update(row).eq("id", input.id)
    : await supabase.from("calendar_events").insert({ ...row, owner_id: user.id });
  if (error) return { ok: false, message: `Couldn't save the event: ${error.message}` };
  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function deleteOwnEvent(id: string): Promise<CalendarResult> {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { ok: false, message: `Couldn't delete the event: ${error.message}` };
  revalidatePath("/admin/calendar");
  return { ok: true };
}

/** All-day: first and last day (end inclusive) stored as Copenhagen midnights; timed: the two instants. */
function rangeOf(input: { start: string; end: string; allDay: boolean }): { start: string; end: string } | { message: string } {
  try {
    if (input.allDay) {
      if (!DAY.test(input.start) || !DAY.test(input.end)) return { message: "Pick the days." };
      if (input.end < input.start) return { message: "The end comes before the start." };
      return { start: zonedLocalToUtc(`${input.start}T00:00`).toISOString(), end: zonedLocalToUtc(`${input.end}T00:00`).toISOString() };
    }
    if (!LOCAL.test(input.start) || !LOCAL.test(input.end)) return { message: "Pick a start and end time." };
    const start = zonedLocalToUtc(input.start);
    const end = zonedLocalToUtc(input.end);
    if (end < start) return { message: "The end comes before the start." };
    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    return { message: "Those dates don't look right." };
  }
}

type MeetingInput = { projectId: string; title: string; start: string; end: string; zoomUrl?: string; notes?: string };

/** A client meeting from the calendar: same as scheduling it on the project's Meetings page. */
export async function scheduleMeetingFromCalendar(input: MeetingInput): Promise<CalendarResult> {
  await requireAxelAdmin();
  if (!input.projectId) return { ok: false, message: "Pick the client project." };
  if (!LOCAL.test(input.start) || !LOCAL.test(input.end)) return { ok: false, message: "Pick a start and end time." };
  const minutes = Math.round((zonedLocalToUtc(input.end).getTime() - zonedLocalToUtc(input.start).getTime()) / 60000);
  if (minutes <= 0) return { ok: false, message: "The meeting must end after it starts." };
  const form = new FormData();
  form.set("title", input.title.trim());
  form.set("scheduled_at", input.start);
  form.set("duration_minutes", String(minutes));
  form.set("zoom_url", input.zoomUrl?.trim() ?? "");
  try {
    await createMeeting(input.projectId, ["/admin/calendar"], form);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't schedule the meeting." };
  }
  if (input.notes?.trim()) {
    // createMeeting has no notes field; add them to the meeting just created.
    const supabase = await createClient();
    const { data } = await supabase
      .from("meetings")
      .select("id")
      .eq("project_id", input.projectId)
      .eq("title", input.title.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) await supabase.from("meetings").update({ notes: input.notes.trim() }).eq("id", data.id);
  }
  refresh();
  return { ok: true };
}

/** Edits a client meeting from the calendar dialog: title, time, length, link and notes. */
export async function updateMeetingFromCalendar(meetingId: string, input: Omit<MeetingInput, "projectId">): Promise<CalendarResult> {
  await requireAxelAdmin();
  const title = input.title.trim();
  if (!title) return { ok: false, message: "Give the meeting a title." };
  if (!LOCAL.test(input.start) || !LOCAL.test(input.end)) return { ok: false, message: "Pick a start and end time." };
  const start = zonedLocalToUtc(input.start);
  const minutes = Math.round((zonedLocalToUtc(input.end).getTime() - start.getTime()) / 60000);
  if (minutes <= 0) return { ok: false, message: "The meeting must end after it starts." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ title, scheduled_at: start.toISOString(), duration_minutes: minutes, zoom_url: input.zoomUrl?.trim() || null, notes: input.notes?.trim() || null })
    .eq("id", meetingId);
  if (error) return { ok: false, message: `Couldn't update the meeting: ${error.message}` };
  const info = await entityInfo("meetings", meetingId, "title");
  await recordActivity({ kind: "meeting", projectId: info.projectId, message: `moved ${quoted(title)} to ${when(start)}` });
  refresh();
  return { ok: true };
}

/**
 * Drag-and-drop: moves (and for meetings and own events, resizes) one item.
 * Meetings get a new time and length; deliverables, data requests and board
 * cards a new due date; own events new start/end. The people involved are
 * notified the same way as when the date changes elsewhere.
 */
export async function moveCalendarItem(id: string, change: { start: string; end: string; allDay: boolean }): Promise<CalendarResult> {
  await requireAxelAdmin();
  const [kind, rowId] = id.split(":");
  if (!rowId) return { ok: false, message: "Unknown item." };
  const supabase = await createClient();

  if (kind === "event") {
    const { data } = await supabase.from("calendar_events").select("title, description, color").eq("id", rowId).maybeSingle();
    if (!data) return { ok: false, message: "That event no longer exists." };
    return saveOwnEvent({ id: rowId, title: data.title, description: data.description ?? undefined, color: data.color, ...change });
  }

  if (kind === "meeting") {
    if (change.allDay || !LOCAL.test(change.start) || !LOCAL.test(change.end)) return { ok: false, message: "Meetings need a time of day." };
    const start = zonedLocalToUtc(change.start);
    const minutes = Math.round((zonedLocalToUtc(change.end).getTime() - start.getTime()) / 60000);
    const { error } = await supabase.from("meetings").update({ scheduled_at: start.toISOString(), duration_minutes: Math.max(minutes, 5) }).eq("id", rowId);
    if (error) return { ok: false, message: `Couldn't move the meeting: ${error.message}` };
    const info = await entityInfo("meetings", rowId, "title");
    await recordActivity({ kind: "meeting", projectId: info.projectId, message: `moved ${quoted(info.name)} to ${when(start)}` });
    refresh();
    return { ok: true };
  }

  const table = kind === "deliverable" ? "deliverables" : kind === "request" ? "data_requests" : kind === "card" ? "board_cards" : null;
  if (!table) return { ok: false, message: "That item's date is set on its own page." };
  if (!DAY.test(change.start)) return { ok: false, message: "Due dates are whole days." };
  const { error } = await supabase.from(table).update({ due_date: change.start }).eq("id", rowId);
  if (error) return { ok: false, message: `Couldn't change the due date: ${error.message}` };
  const info = await entityInfo(table, rowId, "title");
  const day = new Date(`${change.start}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  await recordActivity({
    kind: kind === "deliverable" ? "deliverable" : kind === "card" ? "card" : "file",
    projectId: info.projectId,
    message: `moved the due date of ${quoted(info.name)} to ${day}`,
  });
  refresh();
  return { ok: true };
}
