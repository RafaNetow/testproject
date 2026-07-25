/**
 * Alchemica's own seller details for invoices — required on every Danish
 * invoice (CVR/VAT number, address). Public information (CVR numbers are
 * searchable on cvr.dk), so a plain constant rather than an env var.
 * Fill in cvrNumber and address once you have them.
 */
export const BUSINESS_INFO = {
  name: "Alchemica",
  email: "hello@alchemica.com",
  cvrNumber: "DK36168870",
  address: "", // street, postal code, city
};
