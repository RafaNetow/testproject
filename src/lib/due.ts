import { deriveInvoiceStatus } from "@/lib/invoice-status";

/** Whole days from `today` to `date` (both "YYYY-MM-DD"); negative when the date has passed. */
export function daysUntil(date: string, today: string): number {
  const toUtc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return Math.round((toUtc(date.slice(0, 10)) - toUtc(today.slice(0, 10))) / 86_400_000);
}

/** "Due today", "Due tomorrow", "Due in 3 days", "Overdue 1 day", "Overdue 4 days". */
export function dueLabel(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  return `Overdue ${-days} ${days === -1 ? "day" : "days"}`;
}

export type InvoiceForTotals = { amount_cents: number; currency: string; status: string; due_date: string | null };
export type InvoiceTotals = { currency: string; paid: number; outstanding: number; overdue: number; others: string[] };

/**
 * Paid, outstanding and overdue amounts (cents) for the invoice summary band.
 * Amounts are never added across currencies: the band uses the currency with
 * the most invoices and lists the others so nothing is silently mixed.
 * Drafts aren't money anyone owes yet, so they're left out.
 */
export function invoiceTotals(invoices: InvoiceForTotals[]): InvoiceTotals | null {
  const counted = invoices.filter((i) => i.status !== "draft");
  if (!counted.length) return null;
  const byCurrency = new Map<string, number>();
  for (const i of counted) byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + 1);
  const currency = [...byCurrency.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const totals: InvoiceTotals = { currency, paid: 0, outstanding: 0, overdue: 0, others: [...byCurrency.keys()].filter((c) => c !== currency).sort() };
  for (const i of counted) {
    if (i.currency !== currency) continue;
    const status = deriveInvoiceStatus(i.status, i.due_date);
    if (status === "paid") totals.paid += i.amount_cents;
    else if (status === "overdue") totals.overdue += i.amount_cents;
    else totals.outstanding += i.amount_cents;
  }
  return totals;
}
