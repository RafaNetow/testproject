import { DownloadSimple, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { createInvoice, updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoices";

type Invoice = {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
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
  projectId,
  invoices,
  revalidatePaths,
  canManage,
}: {
  orgId: string;
  projectId: string;
  invoices: Invoice[];
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const createForThisProject = createInvoice.bind(null, orgId, projectId, revalidatePaths);
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <form
          action={createForThisProject}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex min-w-[140px] flex-col gap-1.5">
            <label htmlFor="invoice-number" className="text-sm font-medium text-secondary">
              Invoice #
            </label>
            <input
              id="invoice-number"
              name="invoice_number"
              required
              placeholder="INV-0001"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex w-32 flex-col gap-1.5">
            <label htmlFor="invoice-amount" className="text-sm font-medium text-secondary">
              Amount
            </label>
            <input
              id="invoice-amount"
              name="amount"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="1250.00"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex w-24 flex-col gap-1.5">
            <label htmlFor="invoice-currency" className="text-sm font-medium text-secondary">
              Currency
            </label>
            <select
              id="invoice-currency"
              name="currency"
              defaultValue="DKK"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="DKK">DKK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invoice-due" className="text-sm font-medium text-secondary">
              Due date
            </label>
            <input
              id="invoice-due"
              name="due_date"
              type="date"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <label htmlFor="invoice-pdf" className="text-sm font-medium text-secondary">
              PDF (optional)
            </label>
            <input
              id="invoice-pdf"
              name="pdf"
              type="file"
              accept="application/pdf"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} weight="bold" />
            Create
          </button>
        </form>
      )}

      {!invoices.length ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {invoices.map((inv) => {
            const updateThis = updateInvoiceStatus.bind(null, inv.id, revalidatePaths);
            const deleteThis = deleteInvoice.bind(null, inv.id, inv.pdf_storage_path, revalidatePaths);
            return (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
