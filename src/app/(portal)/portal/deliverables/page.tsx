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

export default async function PortalDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project, role } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Deliverables" title="Deliverables" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, your deliverables will appear here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const deliverables: DeliverableRow[] = await loadDeliverables(supabase, project.id);

  return (
    <div className="flex flex-col gap-8">
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
    </div>
  );
}
