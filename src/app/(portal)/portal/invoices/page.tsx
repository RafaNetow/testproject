import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

const BUCKET = "org-documents";

export default async function PortalInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { org, projects, project, role } = await getPortalProjectContext(projectParam);

  if (!org || !project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Invoices" title="Invoices" />
        <EmptyState title="No project yet">
          Once your engagement is set up, invoices will show up here.
        </EmptyState>
      </Stack>
    );
  }

  if (role !== "owner") {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Invoices" title={org.name} />
        <EmptyState title="Owner-only">
          Invoices are only visible to your workspace&apos;s owner. Ask them if you need a copy.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_date, issued_at, line_items, vat_treatment, tax_rate_pct, buyer_vat_number, discount_cents, pdf_storage_path"
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const invoicesWithUrls = await Promise.all(
    (invoices ?? []).map(async (inv) => {
      if (!inv.pdf_storage_path) return { ...inv, url: null };
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(inv.pdf_storage_path, 3600);
      return { ...inv, url: data?.signedUrl ?? null };
    })
  );

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Invoices"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/invoices" />
          ) : undefined
        }
      />

      <InvoicesView
        orgId={org.id}
        orgName={org.name}
        orgCvrNumber={org.cvrNumber}
        projectId={project.id}
        invoices={invoicesWithUrls}
        unbilledHours={[]}
        revalidatePaths={["/portal/invoices"]}
        canManage={false}
      />
    </Stack>
  );
}
