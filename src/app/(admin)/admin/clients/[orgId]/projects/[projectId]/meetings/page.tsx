import { createClient } from "@/lib/supabase/server";
import { MeetingsView } from "@/components/meetings/meetings-view";

export default async function AdminProjectMeetingsPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, zoom_url, scheduled_at, duration_minutes, status, notes")
    .eq("project_id", projectId)
    .order("scheduled_at", { ascending: false });

  return (
    <MeetingsView
      projectId={projectId}
      meetings={meetings ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/meetings`]}
      canManage
    />
  );
}
