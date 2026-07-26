import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { DecisionsView } from "@/components/decisions/decisions-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { isAxelAdmin } from "@/lib/dal";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project, role } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Decisions" title="Decisions" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, decisions will be logged here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, title, body, decided_at, decision_participants(participant_name)")
    .eq("project_id", project.id)
    .order("decided_at", { ascending: false });

  const admin = await isAxelAdmin();

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Decisions"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/decisions" />
          ) : undefined
        }
      />

      <DecisionsView
        projectId={project.id}
        decisions={decisions ?? []}
        revalidatePaths={["/portal/decisions"]}
        canLog={role === "owner" || admin}
        canDelete={admin}
      />
    </div>
  );
}
