import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { ContractsView } from "@/components/contracts/contracts-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";

const BUCKET = "org-documents";

export default async function PortalContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { org, projects, project, role } = await getPortalProjectContext(projectParam);

  if (!org || !project) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Contracts" title="Contracts" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, contracts will show up here.
          </p>
        </div>
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Contracts" title={org.name} />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">Owner-only</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Contracts are only visible to your workspace&apos;s owner. Ask
            them if you need a copy.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select(
      "id, title, contract_type, signing_status, signed_pdf_storage_path, documenso_document_id, documenso_signing_url"
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const contractsWithUrls = await Promise.all(
    (contracts ?? []).map(async (c) => {
      if (!c.signed_pdf_storage_path) return { ...c, url: null };
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(c.signed_pdf_storage_path, 3600);
      return { ...c, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-8">
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
    </div>
  );
}
