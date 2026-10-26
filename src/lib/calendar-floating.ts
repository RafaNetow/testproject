import { STUDIO_TIMEZONE, addDays, utcToZonedLocal, zonedLocalToUtc, type CalendarEvent, type CalendarEventKind } from "@/lib/calendar";

/**
 * Glue between the portal's events and FullCalendar.
 *
 * FullCalendar runs in "UTC" mode and we feed it *floating* Copenhagen wall
 * times ("2026-10-28T09:30:00", no zone). So 09:30 in Copenhagen shows as 09:30
 * on any computer, and when something is dragged, the Date FullCalendar hands
 * back reads, in UTC, the new Copenhagen wall time — which we turn back into
 * a real instant. Pure, so it can be tested.
 */

/** A real instant → the Copenhagen wall time FullCalendar should draw. */
export function toFloating(instant: string, timeZone = STUDIO_TIMEZONE): string {
  return `${utcToZonedLocal(instant, timeZone)}:00`;
}

/** A Date from FullCalendar (UTC mode) → the "YYYY-MM-DDTHH:mm" wall time it represents. */
export function floatingLocal(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/** A Date from FullCalendar (UTC mode) → the real instant, reading it as Copenhagen time. */
export function fromFloating(date: Date, timeZone = STUDIO_TIMEZONE): string {
  return zonedLocalToUtc(floatingLocal(date), timeZone).toISOString();
}

/** A Date from FullCalendar (UTC mode) → its calendar day. */
export function floatingDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** What can be moved or stretched on the calendar, per kind. */
export const EDITABLE: Record<CalendarEventKind, { move: boolean; resize: boolean }> = {
  event: { move: true, resize: true },
  meeting: { move: true, resize: true },
  deliverable: { move: true, resize: false },
  request: { move: true, resize: false },
  card: { move: true, resize: false },
  stage: { move: false, resize: false },
  invoice: { move: false, resize: false },
  google: { move: false, resize: false },
};

/** The colour names an own event can take (Minimal's set), and the token each uses. */
export const EVENT_COLORS = {
  primary: "--color-accent",
  info: "--color-info",
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
  secondary: "--cat-4",
} as const;
export type EventColor = keyof typeof EVENT_COLORS;

/** The colour a kind of item is drawn in (own events use their chosen colour). */
export const KIND_COLOR: Record<CalendarEventKind, EventColor> = {
  event: "primary",
  meeting: "primary",
  deliverable: "info",
  request: "warning",
  card: "secondary",
  stage: "secondary",
  invoice: "success",
  google: "secondary",
};

export type FullCalendarInput = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  startEditable: boolean;
  durationEditable: boolean;
  classNames: string[];
  extendedProps: { item: CalendarEvent };
};

/** One portal event as FullCalendar wants it (all-day ends are exclusive there). */
export function toFullCalendar(e: CalendarEvent, overdue = false): FullCalendarInput {
  const color = overdue ? "error" : ((e.color as EventColor | undefined) ?? KIND_COLOR[e.kind]);
  const editable = EDITABLE[e.kind];
  return {
    id: e.id,
    title: e.title,
    start: e.allDay ? e.start : toFloating(e.start),
    end: e.allDay ? addDays(e.end, 1) : toFloating(e.end),
    allDay: e.allDay,
    startEditable: editable.move && e.status !== "cancelled",
    durationEditable: editable.resize && e.status !== "cancelled",
    classNames: [`fc-ev-${color}`, `fc-kind-${e.kind}`, ...(e.status === "cancelled" ? ["fc-ev-cancelled"] : [])],
    extendedProps: { item: e },
  };
}
