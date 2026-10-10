import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { Pagination } from "@/components/shared/pagination";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LinkTable } from "@/components/shared/link-table";

const PAGE_SIZE = 25;

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
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Invoices"
        title="All invoices across clients"
        subtitle="To create or edit an invoice, open the client's project."
      />

      {!invoices.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No invoices yet.</Typography>
      ) : (
        <LinkTable
          columns={["Client", "Invoice", "Amount", "Due", "Status"]}
          align={["left", "left", "right", "left", "left"]}
          rows={invoices.map((inv) => ({
            key: inv.id,
            href: `/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`,
            cells: [
              inv.organizations?.name ?? "—",
              inv.invoice_number,
              formatAmount(inv.amount_cents, inv.currency),
              inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB") : "—",
              <StatusBadge key="status" status={deriveInvoiceStatus(inv.status, inv.due_date)} />,
            ],
          }))}
        />
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/admin/invoices" />
    </Stack>
  );
}
