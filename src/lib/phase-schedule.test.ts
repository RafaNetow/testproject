import { describe, expect, it } from "vitest";
import { phaseSchedule } from "./phase-schedule";

const stage = { start: "2026-10-01", end: "2026-10-10" }; // 10 days

describe("phaseSchedule", () => {
  it("is done at 100% whatever the dates", () => {
    expect(phaseSchedule({ start: null, end: null, pct: 100, today: "2026-10-05" })).toEqual({ label: "Done", tone: "neutral" });
  });

  it("has no status without dates", () => {
    expect(phaseSchedule({ start: null, end: null, pct: 40, today: "2026-10-05" })).toBeNull();
  });

  it("counts down to a future stage", () => {
    expect(phaseSchedule({ ...stage, pct: 0, today: "2026-09-28" })).toEqual({ label: "Starts in 3 days", tone: "neutral" });
  });

  it("is on track when progress keeps pace (with slack)", () => {
    // Day 5 of 10 → ~40% expected; 35% is within ten points.
    expect(phaseSchedule({ ...stage, pct: 35, today: "2026-10-05" })).toEqual({ label: "On track", tone: "accent" });
  });

  it("says how many days behind", () => {
    // ~40% expected, 10% done → 30% of 10 days = 3 days.
    expect(phaseSchedule({ ...stage, pct: 10, today: "2026-10-05" })).toEqual({ label: "About 3 days behind", tone: "warning" });
  });

  it("is overdue after the end date", () => {
    expect(phaseSchedule({ ...stage, pct: 80, today: "2026-10-11" })).toEqual({ label: "1 day overdue", tone: "warning" });
    expect(phaseSchedule({ ...stage, pct: 80, today: "2026-10-13" })).toEqual({ label: "3 days overdue", tone: "warning" });
  });
});
