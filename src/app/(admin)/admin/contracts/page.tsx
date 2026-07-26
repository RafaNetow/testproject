import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  msa: "MSA",
  nda: "NDA",
  ip_agreement: "IP Agreement",
  sow: "SOW",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-accent/10 text-accent",
  partially_signed: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  signed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
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

export default async function AdminContractsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("id, title, contract_type, signing_status, project_id, org_id, organizations(name)")
    .order("created_at", { ascending: false });

  const contracts = (data ?? []) as unknown as ContractRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Contracts</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">
          All contracts across clients
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          To create or edit a contract, open the client&apos;s project.
        </p>
      </div>

      {!contracts.length ? (
        <p className="text-sm text-muted-foreground">No contracts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            STATUS_STYLES[c.signing_status] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {c.signing_status.replace("_", " ")}
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
    </div>
  );
}
