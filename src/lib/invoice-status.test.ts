import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { deriveInvoiceStatus } from "./invoice-status";

describe("deriveInvoiceStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flags a sent invoice as overdue once its due date has passed", () => {
    expect(deriveInvoiceStatus("sent", "2026-06-01")).toBe("overdue");
  });

  it("flags a draft invoice as overdue once its due date has passed", () => {
    expect(deriveInvoiceStatus("draft", "2026-06-01")).toBe("overdue");
  });

  it("leaves a sent invoice alone when its due date is in the future", () => {
    expect(deriveInvoiceStatus("sent", "2026-08-25")).toBe("sent");
  });

  it("never marks a paid invoice as overdue", () => {
    expect(deriveInvoiceStatus("paid", "2026-06-01")).toBe("paid");
  });

  it("leaves status alone when there's no due date to compare against", () => {
    expect(deriveInvoiceStatus("sent", null)).toBe("sent");
  });

  it("passes through an already-overdue status unchanged", () => {
    expect(deriveInvoiceStatus("overdue", "2026-08-25")).toBe("overdue");
  });
});
