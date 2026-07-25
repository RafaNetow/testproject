import { createClient } from "@/lib/supabase/server";
import { InvoicesView } from "@/components/invoices/invoices-view";

const BUCKET = "org-documents";

export default async function AdminProjectInvoicesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount_cents, currency, status, due_date, pdf_storage_path")
    .eq("project_id", projectId)
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
    <InvoicesView
      orgId={orgId}
      projectId={projectId}
      invoices={invoicesWithUrls}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/invoices`]}
      canManage
    />
  );
}
