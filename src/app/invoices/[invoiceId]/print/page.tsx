import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoicePreview, type PreviewLineItem, type VatTreatment } from "@/components/invoices/invoice-preview";
import { PrintButton } from "@/components/invoices/print-button";
import { deriveInvoiceStatus } from "@/lib/invoice-status";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, status, due_date, issued_at, line_items, vat_treatment, tax_rate_pct, buyer_vat_number, discount_cents, organizations(name, cvr_number)"
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) notFound();

  const org = invoice.organizations as unknown as { name: string; cvr_number: string | null } | null;

  return (
    <div className="min-h-dvh bg-muted px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="print:hidden flex justify-end">
          <PrintButton />
        </div>
        <InvoicePreview
          orgName={org?.name ?? "Client"}
          orgCvrNumber={org?.cvr_number}
          invoiceNumber={invoice.invoice_number}
          issuedAt={invoice.issued_at}
          dueDate={invoice.due_date}
          currency={invoice.currency}
          lineItems={(invoice.line_items as PreviewLineItem[] | null) ?? []}
          vatTreatment={(invoice.vat_treatment as VatTreatment | null) ?? "domestic"}
          taxRatePct={invoice.tax_rate_pct ?? 0}
          buyerVatNumber={invoice.buyer_vat_number}
          discountCents={invoice.discount_cents ?? 0}
          status={deriveInvoiceStatus(invoice.status, invoice.due_date)}
        />
      </div>
    </div>
  );
}
