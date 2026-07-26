import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { BoardView } from "@/components/board/board-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { isAxelAdmin } from "@/lib/dal";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { org, projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Board" title="Board" />
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
    .select("id, column_id, title, tags, due_date, position, assignee_id")
    .eq("project_id", project.id)
    .order("position");

  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("user_id, profiles(full_name)")
    .eq("org_id", org!.id)
    .not("user_id", "is", null);

  const members = (memberships ?? []).map((m) => ({
    id: m.user_id as string,
    full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }));

  const canDelete = await isAxelAdmin();

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Board"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/board" />
          ) : undefined
        }
      />

      <BoardView
        projectId={project.id}
        columns={columns ?? []}
        cards={cards ?? []}
        members={members}
        revalidatePaths={["/portal/board"]}
        canDelete={canDelete}
      />
    </div>
  );
}
