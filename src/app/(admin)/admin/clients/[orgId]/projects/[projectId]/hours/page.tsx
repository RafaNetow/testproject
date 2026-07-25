import { createClient } from "@/lib/supabase/server";
import { HoursView } from "@/components/hours/hours-view";

export default async function AdminProjectHoursPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("hours_entries")
    .select("id, entry_date, hours, category, description, billable")
    .eq("project_id", projectId)
    .order("entry_date", { ascending: false });

  return (
    <HoursView
      projectId={projectId}
      entries={entries ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/hours`]}
      canLog
    />
  );
}
