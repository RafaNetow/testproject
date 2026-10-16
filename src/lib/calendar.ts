/**
 * Date helpers for the calendar, all pure so they can be unit-tested.
 *
 * Days are handled as "YYYY-MM-DD" keys in the studio's time zone, never as
 * Date objects in whatever zone the server or browser happens to run in. That
 * keeps server and client rendering identical and stops a meeting at 23:30 in
 * Copenhagen from landing on the wrong day.
 */

/** Where Alchemica works; meeting times are typed and shown in this zone. */
export const STUDIO_TIMEZONE = "Europe/Copenhagen";

export type CalendarView = "month" | "week" | "agenda";
export const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "agenda"];

export type CalendarEventKind = "meeting" | "deliverable" | "request" | "stage" | "invoice" | "card" | "google";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  /** ISO instant for timed events; "YYYY-MM-DD" for all-day ones. */
  start: string;
  /** Timed: ISO instant. All-day: last day, inclusive. */
  end: string;
  allDay: boolean;
  status: string;
  href: string | null;
  /** "Client · Project", shown under the title. */
  context: string;
  joinUrl?: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar date of an instant, in the given zone. */
export function dayKey(instant: Date | string, timeZone = STUDIO_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    typeof instant === "string" ? new Date(instant) : instant
  );
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Minutes past midnight of an instant, in the given zone. */
export function minutesOfDay(instant: Date | string, timeZone = STUDIO_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(
    typeof instant === "string" ? new Date(instant) : instant
  );
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return get("hour") * 60 + get("minute");
}

/** How far the zone is ahead of UTC at that instant, in minutes. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/**
 * Reads a wall-clock time typed in a form ("2026-10-16T14:30", from a
 * datetime-local input) as a time in `timeZone`, and returns the real instant.
 * Throws on anything that isn't that shape.
 */
export function zonedLocalToUtc(local: string, timeZone = STUDIO_TIMEZONE): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local.trim());
  if (!m) throw new Error("Use a date and time like 2026-10-16T14:30.");
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi, s || 0);
  // Guess with the offset at the naive time, then correct once: that settles
  // both sides of a summer-time change.
  let utc = naive - offsetMinutes(new Date(naive), timeZone) * 60000;
  utc = naive - offsetMinutes(new Date(utc), timeZone) * 60000;
  return new Date(utc);
}

/** The value a datetime-local input needs to show an instant in `timeZone`. */
export function utcToZonedLocal(instant: Date | string, timeZone = STUDIO_TIMEZONE): string {
  const minutes = minutesOfDay(instant, timeZone);
  return `${dayKey(instant, timeZone)}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function keyToUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function isDayKey(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return utcToKey(keyToUtc(value)) === value;
}

export function addDays(key: string, days: number): string {
  const d = keyToUtc(key);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToKey(d);
}

/** Same day of the month `months` away, clamped to that month's length. */
export function addMonths(key: string, months: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, last));
  return utcToKey(first);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: string): number {
  return (keyToUtc(key).getUTCDay() + 6) % 7;
}

export function startOfWeek(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

export function startOfMonth(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

/** Every day key from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) days.push(k);
  return days;
}

/** The 6 Monday-first weeks a month grid shows (42 days). */
export function monthGrid(key: string): string[] {
  const first = startOfWeek(startOfMonth(key));
  return eachDay(first, addDays(first, 41));
}

export function weekDays(key: string): string[] {
  const first = startOfWeek(key);
  return eachDay(first, addDays(first, 6));
}

/** The first and last day a view shows around `key`. */
export function viewRange(view: CalendarView, key: string): { from: string; to: string } {
  if (view === "month") {
    const grid = monthGrid(key);
    return { from: grid[0], to: grid[grid.length - 1] };
  }
  if (view === "week") {
    const days = weekDays(key);
    return { from: days[0], to: days[6] };
  }
  // Agenda: the next four weeks from the chosen day.
  return { from: key, to: addDays(key, 27) };
}

/** Where the previous / next buttons go. */
export function stepDate(view: CalendarView, key: string, direction: 1 | -1): string {
  if (view === "month") return addMonths(key, direction);
  if (view === "week") return addDays(key, 7 * direction);
  return addDays(key, 28 * direction);
}

/** The heading over the grid, e.g. "October 2026" or "12 – 18 Oct 2026". */
export function viewTitle(view: CalendarView, key: string): string {
  const fmt = (k: string, o: Intl.DateTimeFormatOptions) => keyToUtc(k).toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
  if (view === "month") return fmt(key, { month: "long", year: "numeric" });
  const { from, to } = viewRange(view, key);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = fmt(from, sameMonth ? { day: "numeric" } : sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  return `${start} – ${fmt(to, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** "Fri 16 Oct", for agenda headings and popovers. */
export function formatDay(key: string, options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return keyToUtc(key).toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
}

/** "14:30", in the studio zone. */
export function formatTime(instant: string, timeZone = STUDIO_TIMEZONE): string {
  return new Date(instant).toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** The first and last day an event covers, in the studio zone. */
export function eventDays(e: CalendarEvent, timeZone = STUDIO_TIMEZONE): { first: string; last: string } {
  if (e.allDay) return { first: e.start, last: e.end < e.start ? e.start : e.end };
  const first = dayKey(e.start, timeZone);
  // An event ending exactly at midnight doesn't spill into the next day.
  const endMs = new Date(e.end).getTime() - 1;
  const last = dayKey(new Date(Math.max(endMs, new Date(e.start).getTime())), timeZone);
  return { first, last };
}

/** An all-day event covering more than one day, like a project stage. */
export function isSpan(e: CalendarEvent): boolean {
  return e.allDay && e.end > e.start;
}

/**
 * Events sorted for display: single-day items first (what is due), then
 * multi-day spans, then timed events by start time; ties by title.
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  const rank = (e: CalendarEvent) => (!e.allDay ? 2 : isSpan(e) ? 1 : 0);
  return [...events].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Each day of the range with the events that touch it. Days with nothing are
 * left out.
 *
 * Multi-day spans (stages) would otherwise fill every cell they cover and push
 * out what is actually due, so they are listed once: on their first visible
 * day, and in a month grid again at the start of each week row.
 */
export function groupByDay(
  events: CalendarEvent[],
  from: string,
  to: string,
  { timeZone = STUDIO_TIMEZONE, repeatSpansWeekly = false }: { timeZone?: string; repeatSpansWeekly?: boolean } = {}
): Map<string, CalendarEvent[]> {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of sortEvents(events)) {
    const { first, last } = eventDays(e, timeZone);
    const start = first < from ? from : first;
    const end = last > to ? to : last;
    for (let k = start; k <= end; k = addDays(k, 1)) {
      if (isSpan(e) && k !== start && !(repeatSpansWeekly && weekdayIndex(k) === 0)) continue;
      const list = byDay.get(k);
      if (list) list.push(e);
      else byDay.set(k, [e]);
    }
  }
  return byDay;
}

export type PlacedEvent = { event: CalendarEvent; top: number; height: number; column: number; columns: number };

/**
 * Lays out one day's timed events in a week column: minutes from the top of
 * the visible window, and side-by-side columns where events overlap.
 */
export function layoutDay(
  events: CalendarEvent[],
  day: string,
  window: { startMinute: number; endMinute: number },
  timeZone = STUDIO_TIMEZONE
): PlacedEvent[] {
  const spans = sortEvents(events.filter((e) => !e.allDay)).map((event) => {
    const startDay = dayKey(event.start, timeZone);
    const endDay = eventDays(event, timeZone).last;
    let start = startDay < day ? 0 : minutesOfDay(event.start, timeZone);
    let end = endDay > day ? 24 * 60 : minutesOfDay(event.end, timeZone) || 24 * 60;
    if (end - start < 20) end = start + 20; // short events stay clickable
    start = Math.max(start, window.startMinute);
    end = Math.min(Math.max(end, start + 20), Math.max(window.endMinute, start + 20));
    return { event, start, end };
  });

  // Group events that overlap (directly or through a chain), then give each a column.
  const placed: PlacedEvent[] = [];
  let cluster: { event: CalendarEvent; start: number; end: number; column: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const columns = Math.max(1, ...cluster.map((c) => c.column + 1));
    for (const c of cluster) placed.push({ event: c.event, top: c.start - window.startMinute, height: c.end - c.start, column: c.column, columns });
    cluster = [];
  };
  for (const span of spans) {
    if (span.start >= clusterEnd && cluster.length) flush();
    const taken = new Set(cluster.filter((c) => c.end > span.start).map((c) => c.column));
    let column = 0;
    while (taken.has(column)) column++;
    cluster.push({ ...span, column });
    clusterEnd = Math.max(clusterEnd, span.end);
  }
  if (cluster.length) flush();
  return placed;
}
