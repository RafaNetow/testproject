import { DownloadSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoices";
import { InvoiceBuilder, type UnbilledHoursEntry } from "./invoice-builder";
import { InvoicePreview, type PreviewLineItem, type VatTreatment } from "./invoice-preview";

type Invoice = {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  line_items: PreviewLineItem[] | null;
  vat_treatment: VatTreatment | null;
  tax_rate_pct: number | null;
  buyer_vat_number: string | null;
  discount_cents: number | null;
  pdf_storage_path: string | null;
  url: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-accent/10 text-accent",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-destructive/10 text-destructive",
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export function InvoicesView({
  orgId,
  orgName,
  orgCvrNumber,
  projectId,
  invoices,
  unbilledHours,
  revalidatePaths,
  canManage,
}: {
  orgId: string;
  orgName: string;
  orgCvrNumber?: string | null;
  projectId: string;
  invoices: Invoice[];
  unbilledHours: UnbilledHoursEntry[];
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <InvoiceBuilder
          orgId={orgId}
          projectId={projectId}
          orgName={orgName}
          orgCvrNumber={orgCvrNumber}
          unbilledHours={unbilledHours}
          revalidatePaths={revalidatePaths}
        />
      )}

      {!invoices.length ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((inv) => {
            const updateThis = updateInvoiceStatus.bind(null, inv.id, revalidatePaths);
            const deleteThis = deleteInvoice.bind(
              null,
              inv.id,
              inv.pdf_storage_path,
              revalidatePaths
            );
            return (
              <div key={inv.id} className="rounded-2xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">{inv.invoice_number}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[inv.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatAmount(inv.amount_cents, inv.currency)}
                      {inv.due_date
                        ? ` · Due ${new Date(inv.due_date).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.url && (
                      <a
                        href={inv.url}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                        title="Download PDF"
                        aria-label={`Download invoice ${inv.invoice_number} PDF`}
                      >
                        <DownloadSimple size={16} />
                      </a>
                    )}
                    {canManage && (
                      <>
                        <form action={updateThis}>
                          <AutoSubmitSelect
                            name="status"
                            defaultValue={inv.status}
                            options={statusOptions}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                          />
                        </form>
                        <form action={deleteThis}>
                          <ConfirmButton
                            confirmText={`Delete invoice ${inv.invoice_number}? This can't be undone.`}
                            ariaLabel={`Delete invoice ${inv.invoice_number}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash size={15} />
                          </ConfirmButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>
                <details className="group border-t border-border">
                  <summary className="cursor-pointer list-none px-5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                    View invoice
                  </summary>
                  <div className="border-t border-border p-4">
                    <InvoicePreview
                      orgName={orgName}
                      orgCvrNumber={orgCvrNumber}
                      invoiceNumber={inv.invoice_number}
                      issuedAt={inv.issued_at}
                      dueDate={inv.due_date}
                      currency={inv.currency}
                      lineItems={inv.line_items ?? []}
                      vatTreatment={inv.vat_treatment ?? "domestic"}
                      taxRatePct={inv.tax_rate_pct ?? 0}
                      buyerVatNumber={inv.buyer_vat_number}
                      discountCents={inv.discount_cents ?? 0}
                    />
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
