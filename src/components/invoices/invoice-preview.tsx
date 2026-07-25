export type PreviewLineItem = { description: string; quantity: number; unitPriceCents: number };

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoicePreview({
  orgName,
  invoiceNumber,
  issuedAt,
  dueDate,
  currency,
  lineItems,
  taxRatePct,
  discountCents,
}: {
  orgName: string;
  invoiceNumber: string;
  issuedAt: string | null;
  dueDate: string | null;
  currency: string;
  lineItems: PreviewLineItem[];
  taxRatePct: number;
  discountCents: number;
}) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const taxCents = Math.round(subtotal * (taxRatePct / 100));
  const total = subtotal + taxCents - discountCents;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl font-medium text-primary">Invoice</h2>
        <p className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
          #{invoiceNumber || "—"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Billed by
          </p>
          <p className="mt-1 text-sm font-medium text-primary">Alchemica</p>
          <p className="text-sm text-muted-foreground">hello@alchemica.com</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Billed to
          </p>
          <p className="mt-1 text-sm font-medium text-primary">{orgName}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Issued
          </p>
          <p className="mt-0.5 text-sm text-primary">{formatDate(issuedAt)}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Due
          </p>
          <p className="mt-0.5 text-sm text-primary">{formatDate(dueDate)}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-[1fr_3rem_5rem_5rem] gap-2 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Cost</span>
          <span className="text-right">Total</span>
        </div>
        {!lineItems.length ? (
          <p className="py-4 text-sm text-muted-foreground">No line items yet.</p>
        ) : (
          lineItems.map((li, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_3rem_5rem_5rem] gap-2 border-b border-border py-2.5 text-sm"
            >
              <span className="truncate text-primary">{li.description || "—"}</span>
              <span className="text-right text-secondary">{li.quantity}</span>
              <span className="text-right text-secondary">
                {formatMoney(li.unitPriceCents, currency)}
              </span>
              <span className="text-right font-medium text-primary">
                {formatMoney(li.quantity * li.unitPriceCents, currency)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col items-end gap-1.5 text-sm">
        <div className="flex w-full max-w-[240px] justify-between text-secondary">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        {taxRatePct > 0 && (
          <div className="flex w-full max-w-[240px] justify-between text-secondary">
            <span>Tax ({taxRatePct}%)</span>
            <span>{formatMoney(taxCents, currency)}</span>
          </div>
        )}
        {discountCents > 0 && (
          <div className="flex w-full max-w-[240px] justify-between text-secondary">
            <span>Discount</span>
            <span>-{formatMoney(discountCents, currency)}</span>
          </div>
        )}
        <div className="flex w-full max-w-[240px] justify-between border-t border-border pt-1.5 text-base font-medium text-primary">
          <span>Total</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
