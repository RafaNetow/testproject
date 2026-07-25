/**
 * An invoice that's still "sent" (or "draft") past its due date is overdue —
 * no one should have to remember to flip that switch by hand. The stored
 * `status` column is left untouched (still the source of truth for "paid"),
 * this only affects what's displayed.
 */
export function deriveInvoiceStatus(status: string, dueDate: string | null): string {
  if ((status === "sent" || status === "draft") && dueDate && new Date(dueDate) < new Date()) {
    return "overdue";
  }
  return status;
}
