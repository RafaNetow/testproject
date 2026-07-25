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

  const { data: contracts } = await supabase
    .from("contracts")
    .select(
      "id, title, contract_type, signing_status, signed_pdf_storage_path, documenso_document_id, documenso_signing_url"
    )
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
    <ContractsView
      orgId={orgId}
      projectId={projectId}
      contracts={contractsWithUrls}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/contracts`]}
      canManage
    />
  );
}
