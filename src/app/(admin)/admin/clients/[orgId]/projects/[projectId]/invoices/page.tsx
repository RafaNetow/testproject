import { createClient } from "@/lib/supabase/server";
import { InvoicesView } from "@/components/invoices/invoices-view";

const BUCKET = "org-documents";

export default async function AdminProjectInvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const { orgId, projectId } = await params;
  const { duplicate } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, cvr_number")
    .eq("id", orgId)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_date, issued_at, line_items, vat_treatment, tax_rate_pct, buyer_vat_number, discount_cents, pdf_storage_path"
    )
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

  const { data: unbilledHours } = await supabase
    .from("hours_entries")
    .select("id, entry_date, hours, category, description")
    .eq("project_id", projectId)
    .eq("billable", true)
    .is("invoice_id", null)
    .order("entry_date", { ascending: false });

  const sourceInvoice = duplicate ? invoicesWithUrls.find((inv) => inv.id === duplicate) : null;
  const duplicateFrom = sourceInvoice
    ? {
        sourceId: sourceInvoice.id,
        currency: sourceInvoice.currency,
        lineItems: sourceInvoice.line_items ?? [],
        vatTreatment: sourceInvoice.vat_treatment ?? "domestic",
        taxRatePct: sourceInvoice.tax_rate_pct ?? 25,
        buyerVatNumber: sourceInvoice.buyer_vat_number,
        discountCents: sourceInvoice.discount_cents ?? 0,
      }
    : null;

  return (
    <InvoicesView
      orgId={orgId}
      orgName={org?.name ?? "Client"}
      orgCvrNumber={org?.cvr_number}
      projectId={projectId}
      invoices={invoicesWithUrls}
      unbilledHours={unbilledHours ?? []}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/invoices`]}
      canManage
      basePath={`/admin/clients/${orgId}/projects/${projectId}/invoices`}
      duplicateFrom={duplicateFrom}
    />
  );
}
