import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ContractsView } from "@/components/contracts/contracts-view";

const BUCKET = "org-documents";

export default async function AdminProjectContractsPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.org_id !== orgId) notFound();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, title, contract_type, signing_status, signed_pdf_storage_path")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const contractsWithUrls = await Promise.all(
    (contracts ?? []).map(async (c) => {
      if (!c.signed_pdf_storage_path) return { ...c, url: null };
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(c.signed_pdf_storage_path, 3600);
      return { ...c, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to client
        </Link>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Contracts</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
      </div>

      <ContractsView
        orgId={orgId}
        projectId={projectId}
        contracts={contractsWithUrls}
        revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/contracts`]}
        canManage
      />
    </div>
  );
}
