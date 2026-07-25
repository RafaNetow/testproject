"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "org-documents";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type VatTreatment = "domestic" | "eu_reverse_charge" | "outside_eu";

export type CreateInvoiceInput = {
  invoiceNumber: string;
  currency: string;
  issuedAt: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  vatTreatment: VatTreatment;
  taxRatePct: number;
  buyerVatNumber: string;
  discountCents: number;
  status: "draft" | "sent";
};

export type CreateInvoiceResult = {
  success: boolean;
  message?: string;
};

/** Called directly from the client builder (not a <form action>) since the
 * line-item array doesn't serialize cleanly through FormData. */
export async function createInvoiceWithLineItems(
  orgId: string,
  projectId: string,
  paths: string[],
  input: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  await requireAxelAdmin();

  const invoiceNumber = input.invoiceNumber.trim();
  const items = input.lineItems.filter((li) => li.description.trim() && li.quantity > 0);
  if (!invoiceNumber) {
    return { success: false, message: "Enter an invoice number." };
  }
  if (!items.length) {
    return { success: false, message: "Add at least one line item." };
  }
  if (input.vatTreatment === "eu_reverse_charge" && !input.buyerVatNumber.trim()) {
    return { success: false, message: "Reverse-charge invoices must show the buyer's VAT number." };
  }

  // VAT rate is only meaningful for domestic invoices — reverse charge and
  // outside-EU are always 0%, enforced here regardless of what the client sent.
  const taxRatePct = input.vatTreatment === "domestic" ? input.taxRatePct : 0;
  const subtotal = items.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const taxCents = Math.round(subtotal * (taxRatePct / 100));
  const total = subtotal + taxCents - input.discountCents;

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").insert({
    org_id: orgId,
    project_id: projectId,
    invoice_number: invoiceNumber,
    currency: input.currency,
    amount_cents: total,
    line_items: items,
    vat_treatment: input.vatTreatment,
    tax_rate_pct: taxRatePct,
    buyer_vat_number: input.vatTreatment === "eu_reverse_charge" ? input.buyerVatNumber.trim() : null,
    discount_cents: input.discountCents,
    due_date: input.dueDate || null,
    issued_at: new Date(input.issuedAt).toISOString(),
    status: input.status,
  });
  if (error) {
    return { success: false, message: `Couldn't create invoice: ${error.message}` };
  }
  revalidateAll(paths);
  return { success: true, message: input.status === "draft" ? "Saved as draft." : "Invoice sent." };
}

export async function updateInvoiceStatus(invoiceId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const status = String(formData.get("status") ?? "draft");

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId);
  if (error) {
    throw new Error(`Couldn't update invoice: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteInvoice(
  invoiceId: string,
  pdfStoragePath: string | null,
  paths: string[]
) {
  await requireAxelAdmin();
  const supabase = await createClient();

  if (pdfStoragePath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([pdfStoragePath]);
    if (removeError) {
      throw new Error(`Couldn't delete invoice PDF: ${removeError.message}`);
    }
  }

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) {
    throw new Error(`Couldn't delete invoice: ${error.message}`);
  }
  revalidateAll(paths);
}
