import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { MeetingsView } from "@/components/meetings/meetings-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Meetings" title="Meetings" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, meetings will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, zoom_url, scheduled_at, duration_minutes, status, notes")
    .eq("project_id", project.id)
    .order("scheduled_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Meetings"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/meetings" />
          ) : undefined
        }
      />

      <MeetingsView
        projectId={project.id}
        meetings={meetings ?? []}
        revalidatePaths={["/portal/meetings"]}
        canManage={false}
      />
    </div>
  );
}
