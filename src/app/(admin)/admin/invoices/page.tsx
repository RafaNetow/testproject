import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-accent/10 text-accent",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  overdue: "bg-destructive/10 text-destructive",
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  project_id: string;
  org_id: string;
  organizations: { name: string } | null;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_date, project_id, org_id, organizations(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const invoices = (data ?? []) as unknown as InvoiceRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Invoices</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">
          All invoices across clients
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          To create or edit an invoice, open the client&apos;s project.
        </p>
      </div>

      {!invoices.length ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const displayStatus = deriveInvoiceStatus(inv.status, inv.due_date);
                return (
                <tr
                  key={inv.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted"
                >
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`}
                      className="block px-5 py-3.5 font-medium text-primary"
                    >
                      {inv.organizations?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`}
                      className="block px-5 py-3.5 text-secondary"
                    >
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`}
                      className="block px-5 py-3.5 text-secondary"
                    >
                      {formatAmount(inv.amount_cents, inv.currency)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`}
                      className="block px-5 py-3.5 text-secondary"
                    >
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB") : "—"}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`}
                      className="flex items-center px-5 py-3.5"
                    >
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[displayStatus] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/admin/invoices" />
    </div>
  );
}
