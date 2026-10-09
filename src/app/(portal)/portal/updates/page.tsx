import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { UpdatesView } from "@/components/updates/updates-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Updates" title="Updates" />
        <EmptyState title="No project yet">
          Once your engagement is set up, status updates will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const { data: updates } = await supabase
    .from("weekly_updates")
    .select("id, title, body, published_at")
    .eq("project_id", project.id)
    .order("published_at", { ascending: false });

  return (
    <Stack spacing={4}>
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
    </Stack>
  );
}
