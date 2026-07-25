import { createClient } from "@/lib/supabase/server";
import { DecisionsView } from "@/components/decisions/decisions-view";

export default async function AdminProjectDecisionsPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, title, body, decided_at, decision_participants(participant_name)")
    .eq("project_id", projectId)
    .order("decided_at", { ascending: false });

  return (
    <DecisionsView
      projectId={projectId}
      decisions={decisions ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/decisions`]}
      canLog
      canDelete
    />
  );
}
