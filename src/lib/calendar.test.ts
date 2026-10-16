import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayKey,
  groupByDay,
  isDayKey,
  layoutDay,
  monthGrid,
  stepDate,
  utcToZonedLocal,
  viewRange,
  viewTitle,
  weekDays,
  zonedLocalToUtc,
  type CalendarEvent,
} from "./calendar";

const meeting = (id: string, start: string, end: string): CalendarEvent => ({
  id,
  kind: "meeting",
  title: id,
  start,
  end,
  allDay: false,
  status: "upcoming",
  href: null,
  context: "",
});

describe("zonedLocalToUtc", () => {
  it("reads a winter time as CET (UTC+1)", () => {
    expect(zonedLocalToUtc("2026-01-15T14:30").toISOString()).toBe("2026-01-15T13:30:00.000Z");
  });

  it("reads a summer time as CEST (UTC+2)", () => {
    expect(zonedLocalToUtc("2026-07-01T09:00").toISOString()).toBe("2026-07-01T07:00:00.000Z");
  });

  it("handles the days the clocks change", () => {
    // Clocks go forward at 02:00 on 29 March 2026 and back at 03:00 on 25 October 2026.
    expect(zonedLocalToUtc("2026-03-29T01:30").toISOString()).toBe("2026-03-29T00:30:00.000Z");
    expect(zonedLocalToUtc("2026-03-29T03:30").toISOString()).toBe("2026-03-29T01:30:00.000Z");
    expect(zonedLocalToUtc("2026-10-25T01:30").toISOString()).toBe("2026-10-24T23:30:00.000Z");
    expect(zonedLocalToUtc("2026-10-25T04:00").toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });

  it("round-trips through the form value", () => {
    for (const local of ["2026-01-15T14:30", "2026-07-01T09:00", "2026-10-25T23:45"]) {
      expect(utcToZonedLocal(zonedLocalToUtc(local))).toBe(local);
    }
  });

  it("rejects anything that isn't a datetime-local value", () => {
    expect(() => zonedLocalToUtc("tomorrow")).toThrow();
  });
});

describe("day keys", () => {
  it("puts a late-evening meeting on the Copenhagen day, not the UTC one", () => {
    expect(dayKey("2026-10-16T22:30:00Z")).toBe("2026-10-17");
  });

  it("validates keys", () => {
    expect(isDayKey("2026-02-28")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("16/10/2026")).toBe(false);
  });

  it("clamps months of different lengths", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });
});

describe("view ranges", () => {
  it("month grid is six Monday-first weeks", () => {
    const grid = monthGrid("2026-10-16");
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-09-28");
    expect(grid[41]).toBe("2026-11-08");
  });

  it("week runs Monday to Sunday", () => {
    expect(weekDays("2026-10-18")).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
  });

  it("steps and titles each view", () => {
    expect(stepDate("month", "2026-10-16", 1)).toBe("2026-11-16");
    expect(stepDate("week", "2026-10-16", -1)).toBe("2026-10-09");
    expect(viewRange("agenda", "2026-10-16")).toEqual({ from: "2026-10-16", to: "2026-11-12" });
    expect(viewTitle("month", "2026-10-16")).toBe("October 2026");
    expect(viewTitle("week", "2026-10-16")).toBe("12 – 18 Oct 2026");
    expect(viewTitle("week", "2026-12-30")).toBe("28 Dec 2026 – 3 Jan 2027");
  });
});

describe("groupByDay", () => {
  it("lists a stage once, on its first visible day", () => {
    const stage: CalendarEvent = { ...meeting("Stage", "2026-10-07", "2026-10-20"), kind: "stage", allDay: true };
    expect([...groupByDay([stage], "2026-10-12", "2026-10-18").keys()]).toEqual(["2026-10-12"]);
    expect([...groupByDay([stage], "2026-10-01", "2026-10-31").keys()]).toEqual(["2026-10-07"]);
  });

  it("repeats a stage at the start of each week row in a month grid", () => {
    const stage: CalendarEvent = { ...meeting("Stage", "2026-10-07", "2026-10-20"), kind: "stage", allDay: true };
    expect([...groupByDay([stage], "2026-09-28", "2026-11-08", { repeatSpansWeekly: true }).keys()]).toEqual(["2026-10-07", "2026-10-12", "2026-10-19"]);
  });

  it("puts what is due before stages", () => {
    const stage: CalendarEvent = { ...meeting("A stage", "2026-10-14", "2026-10-20"), kind: "stage", allDay: true };
    const due: CalendarEvent = { ...meeting("Z due", "2026-10-14", "2026-10-14"), kind: "deliverable", allDay: true };
    expect(groupByDay([stage, due], "2026-10-14", "2026-10-14").get("2026-10-14")!.map((e) => e.id)).toEqual(["Z due", "A stage"]);
  });

  it("lists all-day items before timed ones", () => {
    const due: CalendarEvent = { ...meeting("Report due", "2026-10-16", "2026-10-16"), kind: "deliverable", allDay: true };
    const call = meeting("Call", "2026-10-16T08:00:00Z", "2026-10-16T08:30:00Z");
    expect(groupByDay([call, due], "2026-10-16", "2026-10-16").get("2026-10-16")!.map((e) => e.id)).toEqual(["Report due", "Call"]);
  });
});

describe("layoutDay", () => {
  const window = { startMinute: 7 * 60, endMinute: 20 * 60 };

  it("places an event by its Copenhagen time", () => {
    const [p] = layoutDay([meeting("a", "2026-10-16T08:00:00Z", "2026-10-16T09:00:00Z")], "2026-10-16", window);
    // 10:00 CEST is 180 minutes after the 07:00 top of the grid.
    expect(p).toMatchObject({ top: 180, height: 60, column: 0, columns: 1 });
  });

  it("puts overlapping events side by side and leaves others full width", () => {
    const placed = layoutDay(
      [
        meeting("a", "2026-10-16T08:00:00Z", "2026-10-16T09:00:00Z"),
        meeting("b", "2026-10-16T08:30:00Z", "2026-10-16T09:30:00Z"),
        meeting("c", "2026-10-16T12:00:00Z", "2026-10-16T12:30:00Z"),
      ],
      "2026-10-16",
      window
    );
    const byId = Object.fromEntries(placed.map((p) => [p.event.id, p]));
    expect(byId.a).toMatchObject({ column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
    expect(byId.c).toMatchObject({ column: 0, columns: 1 });
  });
});
