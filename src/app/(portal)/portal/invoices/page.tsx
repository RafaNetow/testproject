import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";

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
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Invoices</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">Invoices</h1>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, invoices will show up here.
          </p>
        </div>
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Invoices</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">{org.name}</h1>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">Owner-only</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Invoices are only visible to your workspace&apos;s owner. Ask
            them if you need a copy.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_date, issued_at, line_items, tax_rate_pct, discount_cents, pdf_storage_path"
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Invoices</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
        </div>
        {projects.length > 1 && (
          <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/invoices" />
        )}
      </div>

      <InvoicesView
        orgId={org.id}
        orgName={org.name}
        projectId={project.id}
        invoices={invoicesWithUrls}
        revalidatePaths={["/portal/invoices"]}
        canManage={false}
      />
    </div>
  );
}
