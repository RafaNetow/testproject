import { createClient } from "@/lib/supabase/server";
import { loadContracts } from "@/lib/contracts";
import { ContractsView } from "@/components/contracts/contracts-view";

export default async function AdminProjectContractsPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();
  const contracts = await loadContracts(supabase, projectId);

  return (
    <ContractsView
      orgId={orgId}
      projectId={projectId}
      contracts={contracts}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/contracts`]}
      canManage
    />
  );
}
