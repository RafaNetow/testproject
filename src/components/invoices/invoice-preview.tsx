import { BUSINESS_INFO } from "@/lib/business-info";

export type PreviewLineItem = { description: string; quantity: number; unitPriceCents: number };
export type VatTreatment = "domestic" | "eu_reverse_charge" | "outside_eu";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const VAT_NOTES: Record<VatTreatment, string | null> = {
  domestic: null,
  eu_reverse_charge:
    "Reverse charge — Article 196, VAT Directive 2006/112/EC / Omvendt betalingspligt",
  outside_eu: "Outside the scope of VAT / Ydelse uden for EU",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  overdue: "Overdue",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "text-emerald-600 border-emerald-600/40 dark:text-emerald-400 dark:border-emerald-400/40",
  overdue: "text-destructive border-destructive/40",
};

export function InvoicePreview({
  orgName,
  orgCvrNumber,
  invoiceNumber,
  issuedAt,
  dueDate,
  currency,
  lineItems,
  taxRatePct,
  discountCents,
  vatTreatment,
  buyerVatNumber,
  status,
}: {
  orgName: string;
  orgCvrNumber?: string | null;
  invoiceNumber: string;
  issuedAt: string | null;
  dueDate: string | null;
  currency: string;
  lineItems: PreviewLineItem[];
  taxRatePct: number;
  discountCents: number;
  vatTreatment: VatTreatment;
  buyerVatNumber?: string | null;
  status?: string;
}) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const taxCents = vatTreatment === "domestic" ? Math.round(subtotal * (taxRatePct / 100)) : 0;
  const total = subtotal + taxCents - discountCents;
  const note = VAT_NOTES[vatTreatment];
  const statusLabel = status ? STATUS_LABELS[status] : undefined;

  return (
    <div className="invoice-document relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-1.5 bg-accent" />

      <div className="p-8 sm:p-10">
        {statusLabel && (
          <span
            className={`absolute right-8 top-8 rotate-3 rounded-md border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] ${
              STATUS_COLORS[status!] ?? "text-muted-foreground border-border"
            }`}
          >
            {statusLabel}
          </span>
        )}

        {/* Letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-2xl italic text-primary">{BUSINESS_INFO.name}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{BUSINESS_INFO.email}</p>
            {BUSINESS_INFO.address && (
              <p className="text-sm text-muted-foreground">{BUSINESS_INFO.address}</p>
            )}
            {BUSINESS_INFO.cvrNumber && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                VAT {BUSINESS_INFO.cvrNumber}
              </p>
            )}
          </div>
          <div className="text-right">
            <h2 className="font-display text-4xl font-medium leading-none text-primary">
              Invoice
            </h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              #{invoiceNumber || "—"}
            </p>
          </div>
        </div>

        <div className="mt-8 h-px bg-border" />

        {/* Billed to + dates */}
        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Billed to
            </p>
            <p className="mt-1.5 text-base font-medium text-primary">{orgName}</p>
            {vatTreatment === "domestic" && orgCvrNumber && (
              <p className="font-mono text-xs text-muted-foreground">CVR {orgCvrNumber}</p>
            )}
            {vatTreatment === "eu_reverse_charge" && buyerVatNumber && (
              <p className="font-mono text-xs text-muted-foreground">VAT {buyerVatNumber}</p>
            )}
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Issued
              </p>
              <p className="mt-1.5 text-sm text-primary">{formatDate(issuedAt)}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Due
              </p>
              <p className="mt-1.5 text-sm text-primary">{formatDate(dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-10">
          <div className="grid grid-cols-[1fr_3.5rem_5.5rem_5.5rem] gap-3 border-b border-border pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {!lineItems.length ? (
            <p className="py-6 text-sm text-muted-foreground">No line items yet.</p>
          ) : (
            lineItems.map((li, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_3.5rem_5.5rem_5.5rem] gap-3 border-b border-border py-3.5 text-sm"
              >
                <span className="text-primary">{li.description || "—"}</span>
                <span className="text-right tabular-nums text-secondary">{li.quantity}</span>
                <span className="text-right tabular-nums text-secondary">
                  {formatMoney(li.unitPriceCents, currency)}
                </span>
                <span className="text-right tabular-nums font-medium text-primary">
                  {formatMoney(li.quantity * li.unitPriceCents, currency)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-[260px] flex-col gap-2 text-sm">
            <div className="flex justify-between py-1 text-secondary">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
            </div>
            {vatTreatment === "domestic" && taxRatePct > 0 && (
              <div className="flex justify-between py-1 text-secondary">
                <span>VAT ({taxRatePct}%)</span>
                <span className="tabular-nums">{formatMoney(taxCents, currency)}</span>
              </div>
            )}
            {vatTreatment !== "domestic" && (
              <div className="flex justify-between py-1 text-secondary">
                <span>VAT</span>
                <span className="tabular-nums">{formatMoney(0, currency)}</span>
              </div>
            )}
            {discountCents > 0 && (
              <div className="flex justify-between py-1 text-secondary">
                <span>Discount</span>
                <span className="tabular-nums">-{formatMoney(discountCents, currency)}</span>
              </div>
            )}
            <div className="mt-1 flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-secondary">
                Total
              </span>
              <span className="font-display text-xl font-medium tabular-nums text-primary">
                {formatMoney(total, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="font-display text-sm italic text-secondary">
            Thank you for the opportunity to work together.
          </p>
          {note && <p className="mt-2 font-mono text-[10px] text-muted-foreground">{note}</p>}
        </div>
      </div>
    </div>
  );
}
