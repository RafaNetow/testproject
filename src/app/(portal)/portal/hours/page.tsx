import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { HoursView } from "@/components/hours/hours-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function PortalHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Hours" title="Hours" />
        <EmptyState title="No project yet">
          Once your engagement is set up, logged time will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("hours_entries")
    .select("id, entry_date, hours, category, description, billable, invoice_id")
    .eq("project_id", project.id)
    .order("entry_date", { ascending: false });

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Hours"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/hours" />
          ) : undefined
        }
      />

      <HoursView
        projectId={project.id}
        entries={entries ?? []}
        revalidatePaths={["/portal/hours"]}
        canLog={false}
      />
    </Stack>
  );
}
