import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { UpdatesView } from "@/components/updates/updates-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Updates" title="Updates" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, status updates will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: updates } = await supabase
    .from("weekly_updates")
    .select("id, title, body, published_at")
    .eq("project_id", project.id)
    .order("published_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Updates"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/updates" />
          ) : undefined
        }
      />

      <UpdatesView
        projectId={project.id}
        updates={updates ?? []}
        revalidatePaths={["/portal/updates"]}
        canPublish={false}
        canDelete={false}
      />
    </div>
  );
}
