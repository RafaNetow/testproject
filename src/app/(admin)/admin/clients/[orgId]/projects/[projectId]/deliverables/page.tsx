import { createClient } from "@/lib/supabase/server";
import { DeliverablesView } from "@/components/deliverables/deliverables-view";
import { loadDeliverables } from "@/lib/deliverables-data";
import { todayInCopenhagen, type DeliverableStatus } from "@/lib/deliverables";

// What Alchemica should look at first: things the client is waiting on us for,
// then what's out for review, then work in flight, then drafts and finished work.
const ADMIN_ORDER: Record<DeliverableStatus, number> = {
  changes_requested: 0,
  in_review: 1,
  in_progress: 2,
  draft: 3,
  approved: 4,
};

export default async function AdminProjectDeliverablesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const [deliverables, { data: files }] = await Promise.all([
    loadDeliverables(supabase, projectId),
    supabase
      .from("files")
      .select("id, filename")
      .eq("project_id", projectId)
      .order("filename"),
  ]);

  const sorted = [...deliverables].sort((a, b) => ADMIN_ORDER[a.status] - ADMIN_ORDER[b.status]);

  return (
    <DeliverablesView
      mode="admin"
      projectId={projectId}
      deliverables={sorted}
      projectFiles={files ?? []}
      today={todayInCopenhagen()}
    />
  );
}
