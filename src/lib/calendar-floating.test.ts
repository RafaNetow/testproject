import { describe, expect, it } from "vitest";
import { floatingDay, floatingLocal, fromFloating, timeState, toFloating, toFullCalendar } from "./calendar-floating";
import type { CalendarEvent } from "./calendar";

describe("floating Copenhagen times", () => {
  it("draws an instant at its Copenhagen wall time", () => {
    // 08:30 UTC is 10:30 in Copenhagen in summer time (CEST).
    expect(toFloating("2026-07-01T08:30:00Z")).toBe("2026-07-01T10:30:00");
    // and 11:30 in winter time (CET).
    expect(toFloating("2026-12-01T10:30:00Z")).toBe("2026-12-01T11:30:00");
  });

  it("reads a dropped Date back as Copenhagen time", () => {
    // FullCalendar (UTC mode) hands back 10:30 "UTC" for a drop at 10:30 on the grid.
    const dropped = new Date("2026-07-01T10:30:00Z");
    expect(floatingLocal(dropped)).toBe("2026-07-01T10:30");
    expect(fromFloating(dropped)).toBe("2026-07-01T08:30:00.000Z");
    expect(floatingDay(dropped)).toBe("2026-07-01");
  });

  it("round-trips across the October clock change", () => {
    for (const instant of ["2026-10-24T22:00:00.000Z", "2026-10-26T09:15:00.000Z"]) {
      expect(fromFloating(new Date(`${toFloating(instant)}Z`))).toBe(instant);
    }
  });
});

describe("timeState", () => {
  const d = (s: string) => new Date(`${s}Z`);
  const now = "2026-10-26T10:15:00";

  it("tells a meeting that's over, on now, or ahead", () => {
    expect(timeState(d("2026-10-26T08:00:00"), d("2026-10-26T09:00:00"), false, now)).toBe("past");
    expect(timeState(d("2026-10-26T10:00:00"), d("2026-10-26T11:00:00"), false, now)).toBe("now");
    expect(timeState(d("2026-10-26T11:00:00"), d("2026-10-26T12:00:00"), false, now)).toBe("future");
  });

  it("treats a meeting that just ended as past and one just starting as now", () => {
    expect(timeState(d("2026-10-26T09:15:00"), d("2026-10-26T10:15:00"), false, now)).toBe("past");
    expect(timeState(d("2026-10-26T10:15:00"), d("2026-10-26T11:15:00"), false, now)).toBe("now");
  });

  it("counts an all-day item as on all day, ends exclusive", () => {
    expect(timeState(d("2026-10-26T00:00:00"), null, true, now)).toBe("now");
    expect(timeState(d("2026-10-25T00:00:00"), d("2026-10-26T00:00:00"), true, now)).toBe("past");
    expect(timeState(d("2026-10-20T00:00:00"), d("2026-11-02T00:00:00"), true, now)).toBe("now");
  });
});

describe("toFullCalendar", () => {
  const base: CalendarEvent = { id: "x", kind: "deliverable", title: "Report", start: "2026-10-28", end: "2026-10-28", allDay: true, status: "in_progress", href: null, context: "" };

  it("makes all-day ends exclusive and sets what can be dragged", () => {
    const fc = toFullCalendar(base);
    expect(fc).toMatchObject({ start: "2026-10-28", end: "2026-10-29", allDay: true, startEditable: true, durationEditable: false });
    expect(fc.classNames).toContain("fc-ev-info");
  });

  it("locks stages and invoices, and anything cancelled", () => {
    expect(toFullCalendar({ ...base, kind: "stage" }).startEditable).toBe(false);
    expect(toFullCalendar({ ...base, kind: "invoice" }).startEditable).toBe(false);
    expect(toFullCalendar({ ...base, kind: "meeting", status: "cancelled", allDay: false, start: "2026-10-28T09:00:00Z", end: "2026-10-28T10:00:00Z" }).startEditable).toBe(false);
  });

  it("uses an own event's colour, and red when overdue", () => {
    expect(toFullCalendar({ ...base, kind: "event", color: "warning" }).classNames).toContain("fc-ev-warning");
    expect(toFullCalendar(base, true).classNames).toContain("fc-ev-error");
  });
});
