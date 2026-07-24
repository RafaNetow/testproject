import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { BoardView } from "@/components/board/board-view";

export default async function AdminProjectBoardPage({
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
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to client
        </Link>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Board</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
      </div>

      <BoardView
        projectId={projectId}
        columns={columns ?? []}
        cards={cards ?? []}
        revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/board`]}
        canDelete
      />
    </div>
  );
}
