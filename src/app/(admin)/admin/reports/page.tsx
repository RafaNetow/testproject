import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { createClient } from "@/lib/supabase/server";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { SectionHeader } from "@/components/shared/section-header";
import { StatTiles } from "@/components/shared/stat-tiles";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTable } from "@/components/shared/link-table";
import Stack from "@mui/material/Stack";

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

  const joinMoney = (m: Map<string, number>) =>
    m.size ? [...m.entries()].map(([c, cents]) => formatMoney(cents, c)).join(" · ") : "—";

  return (
    <Stack spacing={5}>
      <SectionHeader
        eyebrow="Reports"
        title="Business overview"
        subtitle="Revenue, outstanding invoices, and billable hours across every client."
        actions={
          <>
            <Button href="/api/export/invoices" variant="outlined" startIcon={<FileDownloadOutlined />} color="secondary">
              Export invoices
            </Button>
            <Button href="/api/export/hours" variant="outlined" startIcon={<FileDownloadOutlined />} color="secondary">
              Export hours
            </Button>
          </>
        }
      />

      <StatTiles
        compact
        tiles={[
          {
            label: "Collected this month",
            value: paidThisMonth.length ? sumByCurrency(paidThisMonth).join(" · ") : "—",
          },
          {
            label: "Outstanding",
            value: outstanding.length ? sumByCurrency(outstanding).join(" · ") : "—",
            hint: `${outstanding.length} invoice(s)`,
          },
          {
            label: "Overdue",
            value: overdue.length ? sumByCurrency(overdue).join(" · ") : "—",
            hint: `${overdue.length} invoice(s)`,
            tone: "error",
          },
          {
            label: "Hours this month",
            value: `${totalHoursThisMonth.toFixed(1)}h`,
            hint: `${totalHoursAllTime.toFixed(1)}h all-time`,
          },
        ]}
      />

      <Stack spacing={1.5}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>By client</Typography>
        {!clientRows.length ? (
          <EmptyState title="Nothing to report yet">No invoices or hours logged yet.</EmptyState>
        ) : (
          <LinkTable
            columns={["Client", "Paid", "Outstanding", "Hours logged"]}
            align={["left", "right", "right", "right"]}
            rows={clientRows.map((row) => ({
              key: row.orgId,
              href: `/admin/clients/${row.orgId}`,
              cells: [
                row.name,
                joinMoney(row.paidCents),
                joinMoney(row.outstandingCents),
                row.hours ? `${row.hours.toFixed(1)}h` : "—",
              ],
            }))}
          />
        )}
      </Stack>

      {unbilledHours > 0 && (
        <Typography sx={{ fontSize: 12, color: "text.muted" }}>
          {unbilledHours.toFixed(1)}h of billable time hasn&apos;t been invoiced yet, across all clients.
        </Typography>
      )}
    </Stack>
  );
}
