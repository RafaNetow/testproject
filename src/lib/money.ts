/** "DKK 12,500.00" style amounts from cents. One place, so every page formats money the same way. */
export function formatMoney(cents: number, currency: string, { whole = false }: { whole?: boolean } = {}) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(cents / 100);
}
