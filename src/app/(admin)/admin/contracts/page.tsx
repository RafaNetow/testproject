import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";

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
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Contracts"
        title="All contracts across clients"
        subtitle="To create or edit a contract, open the client's project."
      />

      {!contracts.length ? (
        <p className="text-sm text-muted-foreground">No contracts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const href = c.project_id
                  ? `/admin/clients/${c.org_id}/projects/${c.project_id}/contracts`
                  : `/admin/clients/${c.org_id}`;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted"
                  >
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5 font-medium text-primary">
                        {c.organizations?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5 text-secondary">
                        {c.title}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5 text-secondary">
                        {TYPE_LABELS[c.contract_type] ?? c.contract_type}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="flex items-center px-5 py-3.5">
                        <StatusBadge status={c.signing_status} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/admin/contracts" />
    </div>
  );
}
