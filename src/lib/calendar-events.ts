import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, zonedLocalToUtc, type CalendarEvent } from "@/lib/calendar";

/** Which side is looking: the admin sees every client and invoices; the portal only its own work. */
export type CalendarSurface = "admin" | "portal";

type ProjectJoin = { name: string; org_id: string; organizations: { name: string } | null } | null;

const PROJECT = "projects(name, org_id, organizations(name))";

function context(p: ProjectJoin, surface: CalendarSurface): string {
  if (!p) return "";
  return surface === "admin" ? `${p.organizations?.name ?? "—"} · ${p.name}` : p.name;
}

function hrefFor(surface: CalendarSurface, section: string, projectId: string, p: ProjectJoin): string | null {
  if (surface === "portal") return `/portal/${section}`;
  if (!p) return null;
  return section === "overview" ? `/admin/clients/${p.org_id}` : `/admin/clients/${p.org_id}/projects/${projectId}/${section}`;
}

/**
 * Everything dated that falls inside `from`–`to` (day keys, inclusive), as
 * calendar events. Runs on the RLS-scoped client, so the portal only ever gets
 * that client's own items and never drafts or invoices.
 */
export async function loadCalendarEvents(
  supabase: SupabaseClient,
  { from, to, surface }: { from: string; to: string; surface: CalendarSurface }
): Promise<CalendarEvent[]> {
  const fromInstant = zonedLocalToUtc(`${from}T00:00`).toISOString();
  const toInstant = zonedLocalToUtc(`${addDays(to, 1)}T00:00`).toISOString();
  const dueBetween = <T>(table: string, columns: string) =>
    supabase.from(table).select(`${columns}, ${PROJECT}`).gte("due_date", from).lte("due_date", to).returns<T[]>();

  type Due = { id: string; title: string; status: string; due_date: string; project_id: string; projects: ProjectJoin };
  type Meeting = {
    id: string;
    title: string;
    status: string;
    scheduled_at: string;
    duration_minutes: number | null;
    zoom_url: string | null;
    notes: string | null;
    project_id: string;
    projects: ProjectJoin;
  };
  type Phase = { id: string; name: string; progress_pct: number; start_date: string; end_date: string | null; project_id: string; projects: ProjectJoin };
  type Invoice = { id: string; invoice_number: string; status: string; due_date: string; project_id: string; projects: ProjectJoin };
  type Card = { id: string; title: string; due_date: string; project_id: string; projects: ProjectJoin };

  const [meetings, deliverables, requests, phases, invoices, cards] = await Promise.all([
    supabase
      .from("meetings")
      .select(`id, title, status, scheduled_at, duration_minutes, zoom_url, notes, project_id, ${PROJECT}`)
      .gte("scheduled_at", fromInstant)
      .lt("scheduled_at", toInstant)
      .returns<Meeting[]>(),
    dueBetween<Due>("deliverables", "id, title, status, due_date, project_id"),
    dueBetween<Due>("data_requests", "id, title, status, due_date, project_id"),
    supabase
      .from("project_phases")
      .select(`id, name, progress_pct, start_date, end_date, project_id, ${PROJECT}`)
      .not("start_date", "is", null)
      .lte("start_date", to)
      .returns<Phase[]>(),
    surface === "admin"
      ? dueBetween<Invoice>("invoices", "id, invoice_number, status, due_date, project_id")
      : Promise.resolve({ data: [] as Invoice[] }),
    surface === "admin"
      ? supabase
          .from("board_cards")
          .select(`id, title, due_date, project_id, ${PROJECT}`)
          .gte("due_date", from)
          .lte("due_date", to)
          .returns<Card[]>()
      : Promise.resolve({ data: [] as Card[] }),
  ]);

  const events: CalendarEvent[] = [];

  for (const m of meetings.data ?? []) {
    const start = new Date(m.scheduled_at);
    const end = new Date(start.getTime() + (m.duration_minutes || 30) * 60000);
    events.push({
      id: `meeting:${m.id}`,
      kind: "meeting",
      title: m.title,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      status: m.status,
      href: hrefFor(surface, "meetings", m.project_id, m.projects),
      context: context(m.projects, surface),
      joinUrl: m.status === "cancelled" ? null : m.zoom_url,
      meeting: { projectId: m.project_id, durationMinutes: m.duration_minutes, zoomUrl: m.zoom_url, notes: m.notes },
    });
  }

  for (const d of deliverables.data ?? []) {
    events.push({
      id: `deliverable:${d.id}`,
      kind: "deliverable",
      title: d.title,
      start: d.due_date,
      end: d.due_date,
      allDay: true,
      status: d.status,
      href: hrefFor(surface, "deliverables", d.project_id, d.projects),
      context: context(d.projects, surface),
    });
  }

  for (const r of requests.data ?? []) {
    events.push({
      id: `request:${r.id}`,
      kind: "request",
      title: r.title,
      start: r.due_date,
      end: r.due_date,
      allDay: true,
      status: r.status,
      href: hrefFor(surface, "files", r.project_id, r.projects),
      context: context(r.projects, surface),
    });
  }

  for (const p of phases.data ?? []) {
    const end = p.end_date ?? p.start_date;
    if (end < from) continue;
    events.push({
      id: `stage:${p.id}`,
      kind: "stage",
      title: p.name,
      start: p.start_date,
      end,
      allDay: true,
      status: p.progress_pct >= 100 ? "done" : p.progress_pct > 0 ? "in_progress" : "not_started",
      href: hrefFor(surface, surface === "admin" ? "overview" : "", p.project_id, p.projects)?.replace(/\/$/, "") ?? null,
      context: context(p.projects, surface),
    });
  }

  for (const i of invoices.data ?? []) {
    events.push({
      id: `invoice:${i.id}`,
      kind: "invoice",
      title: `Invoice ${i.invoice_number}`,
      start: i.due_date,
      end: i.due_date,
      allDay: true,
      status: i.status,
      href: hrefFor(surface, "invoices", i.project_id, i.projects),
      context: context(i.projects, surface),
    });
  }

  for (const c of cards.data ?? []) {
    events.push({
      id: `card:${c.id}`,
      kind: "card",
      title: c.title,
      start: c.due_date,
      end: c.due_date,
      allDay: true,
      status: "",
      href: hrefFor(surface, "board", c.project_id, c.projects),
      context: context(c.projects, surface),
    });
  }

  return events;
}
