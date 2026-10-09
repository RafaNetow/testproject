import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import {
  DeliverablesView,
  type DeliverableRow,
} from "@/components/deliverables/deliverables-view";
import { loadDeliverables } from "@/lib/deliverables-data";
import { todayInCopenhagen } from "@/lib/deliverables";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function PortalDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project, role } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Deliverables" title="Deliverables" />
        <EmptyState title="No project yet">
          Once your engagement is set up, your deliverables will appear here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const deliverables: DeliverableRow[] = await loadDeliverables(supabase, project.id);

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Deliverables"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/deliverables" />
          ) : undefined
        }
      />

      <DeliverablesView
        mode="client"
        projectId={project.id}
        deliverables={deliverables}
        canReview={role === "owner"}
        today={todayInCopenhagen()}
      />
    </Stack>
  );
}
