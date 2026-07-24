import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { BoardView } from "@/components/board/board-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { isAxelAdmin } from "@/lib/dal";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Board</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">Board</h1>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">
            No project yet
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, its board will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: columns } = await supabase
    .from("board_columns")
    .select("id, name, position")
    .eq("project_id", project.id)
    .order("position");
  const { data: cards } = await supabase
    .from("board_cards")
    .select("id, column_id, title, tags, due_date, position")
    .eq("project_id", project.id)
    .order("position");

  const canDelete = await isAxelAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Board</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
        </div>
        {projects.length > 1 && (
          <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/board" />
        )}
      </div>

      <BoardView
        projectId={project.id}
        columns={columns ?? []}
        cards={cards ?? []}
        revalidatePaths={["/portal/board"]}
        canDelete={canDelete}
      />
    </div>
  );
}
