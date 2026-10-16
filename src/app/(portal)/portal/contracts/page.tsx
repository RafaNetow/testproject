import { createClient } from "@/lib/supabase/server";
import { loadContracts } from "@/lib/contracts";
import { getPortalProjectContext } from "@/lib/portal-context";
import { ContractsView } from "@/components/contracts/contracts-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function PortalContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { org, projects, project, role } = await getPortalProjectContext(projectParam);

  if (!org || !project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Contracts" title="Contracts" />
        <EmptyState title="No project yet">
          Once your engagement is set up, contracts will show up here.
        </EmptyState>
      </Stack>
    );
  }

  if (role !== "owner") {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Contracts" title={org.name} />
        <EmptyState title="Owner-only">
          Contracts are only visible to your workspace&apos;s owner. Ask them if you need a copy.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const contractsWithUrls = await loadContracts(supabase, project.id);

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Contracts"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/contracts" />
          ) : undefined
        }
      />

      <ContractsView
        orgId={org.id}
        projectId={project.id}
        contracts={contractsWithUrls}
        revalidatePaths={["/portal/contracts"]}
        canManage={false}
      />
    </Stack>
  );
}
