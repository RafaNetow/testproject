import { createClient } from "@/lib/supabase/server";
import { BoardView } from "@/components/board/board-view";

export default async function AdminProjectBoardPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: columns } = await supabase
    .from("board_columns")
    .select("id, name, position")
    .eq("project_id", projectId)
    .order("position");

  const { data: cards } = await supabase
    .from("board_cards")
    .select("id, column_id, title, tags, due_date, position, assignee_id")
    .eq("project_id", projectId)
    .order("position");

  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("user_id, profiles(full_name)")
    .eq("org_id", orgId)
    .not("user_id", "is", null);

  const members = (memberships ?? []).map((m) => ({
    id: m.user_id as string,
    full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }));

  return (
    <BoardView
      projectId={projectId}
      columns={columns ?? []}
      cards={cards ?? []}
      members={members}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/board`]}
      canDelete
    />
  );
}
