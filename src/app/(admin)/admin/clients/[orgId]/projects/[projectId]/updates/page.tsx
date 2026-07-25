import { createClient } from "@/lib/supabase/server";
import { UpdatesView } from "@/components/updates/updates-view";

export default async function AdminProjectUpdatesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: updates } = await supabase
    .from("weekly_updates")
    .select("id, title, body, published_at")
    .eq("project_id", projectId)
    .order("published_at", { ascending: false });

  return (
    <UpdatesView
      projectId={projectId}
      updates={updates ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/updates`]}
      canPublish
      canDelete
    />
  );
}
