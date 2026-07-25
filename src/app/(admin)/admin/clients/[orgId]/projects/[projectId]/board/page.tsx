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
    .select("id, column_id, title, tags, due_date, position")
    .eq("project_id", projectId)
    .order("position");

  return (
    <BoardView
      projectId={projectId}
      columns={columns ?? []}
      cards={cards ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/board`]}
      canDelete
    />
  );
}
