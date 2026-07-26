export type PreviewLineItem = { description: string; quantity: number; unitPriceCents: number };
export type VatTreatment = "domestic" | "eu_reverse_charge" | "outside_eu";

/**
 * Reverse-charge and outside-EU invoices are always 0% VAT regardless of
 * whatever tax_rate_pct is stored — the rate column only applies when the
 * treatment is domestic.
 */
export function computeInvoiceTotals(
  lineItems: PreviewLineItem[],
  vatTreatment: VatTreatment,
  taxRatePct: number,
  discountCents: number
) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const taxCents = vatTreatment === "domestic" ? Math.round(subtotal * (taxRatePct / 100)) : 0;
  const total = subtotal + taxCents - discountCents;
  return { subtotal, taxCents, total };
}
