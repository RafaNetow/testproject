import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LinkTable } from "@/components/shared/link-table";

const PAGE_SIZE = 25;

const TYPE_LABELS: Record<string, string> = {
  msa: "MSA",
  nda: "NDA",
  ip_agreement: "IP Agreement",
  sow: "SOW",
};

type ContractRow = {
  id: string;
  title: string;
  contract_type: string;
  signing_status: string;
  project_id: string | null;
  org_id: string;
  organizations: { name: string } | null;
};

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("contracts")
    .select("id, title, contract_type, signing_status, project_id, org_id, organizations(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const contracts = (data ?? []) as unknown as ContractRow[];

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Contracts"
        title="All contracts across clients"
        subtitle="To create or edit a contract, open the client's project."
      />

      {!contracts.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No contracts yet.</Typography>
      ) : (
        <LinkTable
          columns={["Client", "Title", "Type", "Status"]}
          rows={contracts.map((c) => ({
            key: c.id,
            href: c.project_id
              ? `/admin/clients/${c.org_id}/projects/${c.project_id}/contracts`
              : `/admin/clients/${c.org_id}`,
            cells: [
              c.organizations?.name ?? "—",
              c.title,
              TYPE_LABELS[c.contract_type] ?? c.contract_type,
              <StatusBadge key="status" status={c.signing_status} />,
            ],
          }))}
        />
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/admin/contracts" />
    </Stack>
  );
}
