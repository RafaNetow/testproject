import { describe, expect, it } from "vitest";
import { daysUntil, dueLabel, invoiceTotals } from "./due";
import { formatMoney } from "./money";

describe("daysUntil / dueLabel", () => {
  it("counts whole days either way", () => {
    expect(daysUntil("2026-10-26", "2026-10-23")).toBe(3);
    expect(daysUntil("2026-10-23", "2026-10-23")).toBe(0);
    expect(daysUntil("2026-10-21", "2026-10-23")).toBe(-2);
    // Across the end of summer time in Copenhagen (25 Oct): still whole days.
    expect(daysUntil("2026-10-27", "2026-10-24")).toBe(3);
  });

  it("words it", () => {
    expect([0, 1, 4, -1, -3].map(dueLabel)).toEqual(["Due today", "Due tomorrow", "Due in 4 days", "Overdue 1 day", "Overdue 3 days"]);
  });
});

describe("invoiceTotals", () => {
  const past = "2020-01-01";
  const future = "2999-01-01";

  it("splits paid, outstanding and overdue, leaving drafts out", () => {
    expect(
      invoiceTotals([
        { amount_cents: 100_00, currency: "DKK", status: "paid", due_date: past },
        { amount_cents: 50_00, currency: "DKK", status: "sent", due_date: future },
        { amount_cents: 25_00, currency: "DKK", status: "sent", due_date: past },
        { amount_cents: 999_00, currency: "DKK", status: "draft", due_date: future },
      ])
    ).toEqual({ currency: "DKK", paid: 100_00, outstanding: 50_00, overdue: 25_00, others: [] });
  });

  it("never adds across currencies", () => {
    const t = invoiceTotals([
      { amount_cents: 100, currency: "DKK", status: "paid", due_date: past },
      { amount_cents: 100, currency: "DKK", status: "paid", due_date: past },
      { amount_cents: 70, currency: "EUR", status: "sent", due_date: future },
    ]);
    expect(t).toEqual({ currency: "DKK", paid: 200, outstanding: 0, overdue: 0, others: ["EUR"] });
  });

  it("is empty with no real invoices", () => {
    expect(invoiceTotals([{ amount_cents: 1, currency: "DKK", status: "draft", due_date: null }])).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats cents", () => {
    // Intl separates the code with a no-break space; compare with plain spaces.
    const plain = (s: string) => s.replace(/\s/g, " ");
    expect(plain(formatMoney(1250000, "DKK"))).toBe("DKK 12,500.00");
    expect(plain(formatMoney(1250000, "DKK", { whole: true }))).toBe("DKK 12,500");
  });
});
