import { describe, expect, it } from "vitest";
import { computeInvoiceTotals } from "./invoice-totals";

describe("computeInvoiceTotals", () => {
  it("sums line items and applies domestic VAT", () => {
    const result = computeInvoiceTotals(
      [{ description: "Advisory work", quantity: 2, unitPriceCents: 50000 }],
      "domestic",
      25,
      0
    );
    expect(result.subtotal).toBe(100000);
    expect(result.taxCents).toBe(25000);
    expect(result.total).toBe(125000);
  });

  it("charges 0% VAT for EU reverse-charge regardless of stored tax rate", () => {
    const result = computeInvoiceTotals(
      [{ description: "Advisory work", quantity: 1, unitPriceCents: 100000 }],
      "eu_reverse_charge",
      25,
      0
    );
    expect(result.taxCents).toBe(0);
    expect(result.total).toBe(100000);
  });

  it("charges 0% VAT for outside-EU regardless of stored tax rate", () => {
    const result = computeInvoiceTotals(
      [{ description: "Advisory work", quantity: 1, unitPriceCents: 100000 }],
      "outside_eu",
      25,
      0
    );
    expect(result.taxCents).toBe(0);
    expect(result.total).toBe(100000);
  });

  it("subtracts a discount after VAT", () => {
    const result = computeInvoiceTotals(
      [{ description: "Advisory work", quantity: 1, unitPriceCents: 100000 }],
      "domestic",
      25,
      10000
    );
    expect(result.subtotal).toBe(100000);
    expect(result.taxCents).toBe(25000);
    expect(result.total).toBe(115000);
  });

  it("rounds fractional VAT to the nearest cent", () => {
    const result = computeInvoiceTotals(
      [{ description: "Odd amount", quantity: 1, unitPriceCents: 333 }],
      "domestic",
      25,
      0
    );
    // 333 * 0.25 = 83.25 -> rounds to 83
    expect(result.taxCents).toBe(83);
  });

  it("sums multiple line items with fractional quantities (e.g. hours)", () => {
    const result = computeInvoiceTotals(
      [
        { description: "Day 1", quantity: 3.5, unitPriceCents: 85000 },
        { description: "Day 2", quantity: 5.5, unitPriceCents: 85000 },
      ],
      "domestic",
      25,
      0
    );
    expect(result.subtotal).toBe(9 * 85000);
  });

  it("returns zero totals for no line items", () => {
    const result = computeInvoiceTotals([], "domestic", 25, 0);
    expect(result).toEqual({ subtotal: 0, taxCents: 0, total: 0 });
  });
});
