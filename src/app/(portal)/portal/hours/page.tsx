import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { HoursView } from "@/components/hours/hours-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";

export default async function PortalHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Hours" title="Hours" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, logged time will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("hours_entries")
    .select("id, entry_date, hours, category, description, billable, invoice_id")
    .eq("project_id", project.id)
    .order("entry_date", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
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
    </div>
  );
}
