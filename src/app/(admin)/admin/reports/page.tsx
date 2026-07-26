import Link from "next/link";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { deriveInvoiceStatus } from "@/lib/invoice-status";

type InvoiceRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  org_id: string;
  organizations: { name: string } | null;
};

type HoursRow = {
  hours: number;
  billable: boolean;
  invoice_id: string | null;
  entry_date: string;
  project_id: string;
  projects: { org_id: string; organizations: { name: string } | null } | null;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

/** Sums cents per currency — invoices span DKK/EUR/USD, so totals must never be added across currencies. */
function sumByCurrency(rows: { amount_cents: number; currency: string }[]) {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.amount_cents);
  return [...totals.entries()].map(([currency, cents]) => formatMoney(cents, currency));
}

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: invoiceData }, { data: hoursData }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, amount_cents, currency, status, due_date, issued_at, org_id, organizations(name)")
      .order("issued_at", { ascending: false }),
    supabase
      .from("hours_entries")
      .select(
        "hours, billable, invoice_id, entry_date, project_id, projects(org_id, organizations(name))"
      ),
  ]);

  const invoices = (invoiceData ?? []) as unknown as InvoiceRow[];
  const hours = (hoursData ?? []) as unknown as HoursRow[];

  const withDisplayStatus = invoices.map((inv) => ({
    ...inv,
    displayStatus: deriveInvoiceStatus(inv.status, inv.due_date),
  }));

  const paid = withDisplayStatus.filter((i) => i.displayStatus === "paid");
  const paidThisMonth = paid.filter((i) => (i.issued_at ?? "") >= monthStart);
  const outstanding = withDisplayStatus.filter(
    (i) => i.displayStatus === "sent" || i.displayStatus === "draft" || i.displayStatus === "overdue"
  );
  const overdue = withDisplayStatus.filter((i) => i.displayStatus === "overdue");

  const hoursThisMonth = hours.filter((h) => h.entry_date >= monthStart);
  const totalHoursAllTime = hours.reduce((sum, h) => sum + Number(h.hours), 0);
  const totalHoursThisMonth = hoursThisMonth.reduce((sum, h) => sum + Number(h.hours), 0);
  const unbilledHours = hours
    .filter((h) => h.billable && !h.invoice_id)
    .reduce((sum, h) => sum + Number(h.hours), 0);

  // Per-client breakdown
  const byClient = new Map<
    string,
    { name: string; paidCents: Map<string, number>; outstandingCents: Map<string, number>; hours: number }
  >();
  function clientRow(orgId: string, name: string) {
    if (!byClient.has(orgId)) {
      byClient.set(orgId, { name, paidCents: new Map(), outstandingCents: new Map(), hours: 0 });
    }
    return byClient.get(orgId)!;
  }
  for (const inv of paid) {
    const row = clientRow(inv.org_id, inv.organizations?.name ?? "—");
    row.paidCents.set(inv.currency, (row.paidCents.get(inv.currency) ?? 0) + inv.amount_cents);
  }
  for (const inv of outstanding) {
    const row = clientRow(inv.org_id, inv.organizations?.name ?? "—");
    row.outstandingCents.set(inv.currency, (row.outstandingCents.get(inv.currency) ?? 0) + inv.amount_cents);
  }
  for (const h of hours) {
    const orgId = h.projects?.org_id;
    if (!orgId) continue;
    const row = clientRow(orgId, h.projects?.organizations?.name ?? "—");
    row.hours += Number(h.hours);
  }
  const clientRows = [...byClient.entries()]
    .map(([orgId, row]) => ({ orgId, ...row }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Reports</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">Business overview</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Revenue, outstanding invoices, and billable hours across every client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/invoices"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-secondary transition-colors hover:bg-muted"
          >
            <DownloadSimple size={15} />
            Export invoices
          </a>
          <a
            href="/api/export/hours"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-secondary transition-colors hover:bg-muted"
          >
            <DownloadSimple size={15} />
            Export hours
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Collected this month</p>
          <p className="mt-2 font-display text-2xl font-medium text-primary">
            {paidThisMonth.length ? sumByCurrency(paidThisMonth).join(" · ") : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Outstanding</p>
          <p className="mt-2 font-display text-2xl font-medium text-primary">
            {outstanding.length ? sumByCurrency(outstanding).join(" · ") : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{outstanding.length} invoice(s)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Overdue</p>
          <p className="mt-2 font-display text-2xl font-medium text-destructive">
            {overdue.length ? sumByCurrency(overdue).join(" · ") : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{overdue.length} invoice(s)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Hours this month</p>
          <p className="mt-2 font-display text-2xl font-medium text-primary">
            {totalHoursThisMonth.toFixed(1)}h
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{totalHoursAllTime.toFixed(1)}h all-time</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-secondary">By client</p>
        {!clientRows.length ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No invoices or hours logged yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Hours logged</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((row) => (
                  <tr
                    key={row.orgId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted"
                  >
                    <td className="p-0">
                      <Link href={`/admin/clients/${row.orgId}`} className="block px-5 py-3.5 font-medium text-primary">
                        {row.name}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/admin/clients/${row.orgId}`} className="block px-5 py-3.5 text-secondary">
                        {row.paidCents.size
                          ? [...row.paidCents.entries()].map(([c, cents]) => formatMoney(cents, c)).join(" · ")
                          : "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/admin/clients/${row.orgId}`} className="block px-5 py-3.5 text-secondary">
                        {row.outstandingCents.size
                          ? [...row.outstandingCents.entries()]
                              .map(([c, cents]) => formatMoney(cents, c))
                              .join(" · ")
                          : "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/admin/clients/${row.orgId}`} className="block px-5 py-3.5 text-secondary">
                        {row.hours ? `${row.hours.toFixed(1)}h` : "—"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unbilledHours > 0 && (
        <p className="text-xs text-muted-foreground">
          {unbilledHours.toFixed(1)}h of billable time hasn&apos;t been invoiced yet, across all clients.
        </p>
      )}
    </div>
  );
}
