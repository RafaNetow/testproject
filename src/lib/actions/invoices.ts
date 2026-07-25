"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "org-documents";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createInvoice(
  orgId: string,
  projectId: string,
  paths: string[],
  formData: FormData
) {
  await requireAxelAdmin();

  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const currency = String(formData.get("currency") ?? "DKK");
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (!invoiceNumber || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter an invoice number and a valid amount.");
  }

  const supabase = await createClient();
  const file = formData.get("pdf");
  let pdfStoragePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    pdfStoragePath = `${orgId}/invoices/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(pdfStoragePath, file, { contentType: file.type || undefined });
    if (uploadError) {
      throw new Error(`Couldn't upload PDF: ${uploadError.message}`);
    }
  }

  const { error } = await supabase.from("invoices").insert({
    org_id: orgId,
    project_id: projectId,
    invoice_number: invoiceNumber,
    amount_cents: Math.round(amount * 100),
    currency,
    due_date: dueDate || null,
    pdf_storage_path: pdfStoragePath,
    issued_at: new Date().toISOString(),
    status: "sent",
  });
  if (error) {
    if (pdfStoragePath) await supabase.storage.from(BUCKET).remove([pdfStoragePath]);
    throw new Error(`Couldn't create invoice: ${error.message}`);
  }
  revalidateAll(paths);
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
