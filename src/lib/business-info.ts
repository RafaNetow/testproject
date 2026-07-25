/**
 * Seller details for invoices — required on every Danish invoice
 * (registered legal name, VAT/CVR number, address). Public information
 * (CVR numbers are searchable on cvr.dk), so a plain constant rather than
 * an env var.
 *
 * `name` must match what's actually registered under the CVR number below
 * (currently "Webxite"), not the "Alchemica" trading/brand name — an
 * invoice has to match the government registration. Update this the
 * moment the CVR registration itself is renamed, whether to Alchemica or
 * something else.
 */
export const BUSINESS_INFO = {
  name: "Webxite",
  email: "hello@alchemica.com",
  cvrNumber: "DK36168870",
  address: "", // street, postal code, city — still missing, required for a fully compliant invoice
};
