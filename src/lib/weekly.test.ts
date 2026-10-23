import { describe, expect, it } from "vitest";
import { weekLabels, weeklyCounts, weeklySums, weeksAgo } from "./weekly";

const now = new Date("2026-10-22T12:00:00Z");

describe("weeklyCounts", () => {
  it("buckets by week, oldest first", () => {
    const dates = [
      "2026-10-22T09:00:00Z", // this week
      "2026-10-20T09:00:00Z", // this week
      "2026-10-14T09:00:00Z", // last week
      "2026-09-30T09:00:00Z", // three weeks ago
    ];
    expect(weeklyCounts(dates, 4, now)).toEqual([1, 0, 1, 2]);
  });

  it("ignores missing, future and too-old dates, and accepts plain days", () => {
    expect(weeklyCounts([null, undefined, "2026-11-01T00:00:00Z", "2025-01-01T00:00:00Z", "2026-10-21"], 3, now)).toEqual([0, 0, 1]);
  });

  it("adds values per week", () => {
    expect(weeklySums([{ date: "2026-10-21", value: 2.5 }, { date: "2026-10-20", value: 1 }, { date: "2026-10-12", value: 4 }, { date: null, value: 9 }], 3, now)).toEqual([0, 4, 3.5]);
  });

  it("labels each week by its first day", () => {
    expect(weekLabels(2, now)).toEqual(["9 Oct", "16 Oct"]);
  });

  it("gives the start of the window", () => {
    expect(weeksAgo(2, now)).toBe("2026-10-08T12:00:00.000Z");
  });
});
