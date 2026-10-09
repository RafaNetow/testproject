import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  groupForClient,
  isDeliverableStatus,
  isOverdue,
  todayInCopenhagen,
} from "./deliverables";

describe("isDeliverableStatus", () => {
  it("accepts the five lifecycle statuses", () => {
    for (const s of ["draft", "in_progress", "in_review", "changes_requested", "approved"]) {
      expect(isDeliverableStatus(s)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isDeliverableStatus("delivered")).toBe(false);
    expect(isDeliverableStatus("")).toBe(false);
  });
});

describe("isOverdue", () => {
  const today = "2026-10-09";

  it("flags unfinished work whose due date has passed", () => {
    expect(isOverdue("2026-10-08", "in_progress", today)).toBe(true);
    expect(isOverdue("2026-10-08", "changes_requested", today)).toBe(true);
  });

  it("does not flag something due today", () => {
    expect(isOverdue("2026-10-09", "in_progress", today)).toBe(false);
  });

  it("never flags approved, draft, or awaiting-client work", () => {
    expect(isOverdue("2026-01-01", "approved", today)).toBe(false);
    expect(isOverdue("2026-01-01", "draft", today)).toBe(false);
    expect(isOverdue("2026-01-01", "in_review", today)).toBe(false);
  });

  it("is false without a due date", () => {
    expect(isOverdue(null, "in_progress", today)).toBe(false);
  });
});

describe("groupForClient", () => {
  it("splits deliverables into the client's four buckets", () => {
    const items = [
      { id: 1, status: "approved" as const },
      { id: 2, status: "in_review" as const },
      { id: 3, status: "in_progress" as const },
      { id: 4, status: "changes_requested" as const },
      { id: 5, status: "in_review" as const },
    ];
    const g = groupForClient(items);
    expect(g.awaitingReview.map((d) => d.id)).toEqual([2, 5]);
    expect(g.changesRequested.map((d) => d.id)).toEqual([4]);
    expect(g.inProgress.map((d) => d.id)).toEqual([3]);
    expect(g.approved.map((d) => d.id)).toEqual([1]);
  });
});

describe("date helpers", () => {
  it("formats a date-only value without shifting the day", () => {
    expect(formatDateOnly("2026-10-09")).toBe("9 Oct 2026");
    expect(formatDateOnly("2026-01-01")).toBe("1 Jan 2026");
  });

  it("resolves 'today' in Copenhagen, not UTC", () => {
    // 23:30 UTC on 8 Oct is already 9 Oct in Copenhagen (UTC+2 in summer).
    expect(todayInCopenhagen(new Date("2026-10-08T23:30:00Z"))).toBe("2026-10-09");
    expect(todayInCopenhagen(new Date("2026-10-08T10:00:00Z"))).toBe("2026-10-08");
  });
});
