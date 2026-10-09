import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { MeetingsView } from "@/components/meetings/meetings-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Meetings" title="Meetings" />
        <EmptyState title="No project yet">
          Once your engagement is set up, meetings will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, zoom_url, scheduled_at, duration_minutes, status, notes")
    .eq("project_id", project.id)
    .order("scheduled_at", { ascending: false });

  return (
    <Stack spacing={4}>
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
    </Stack>
  );
}
