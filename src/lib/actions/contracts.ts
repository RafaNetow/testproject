"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "org-documents";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createContract(
  orgId: string,
  projectId: string,
  paths: string[],
  formData: FormData
) {
  await requireAxelAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const contractType = String(formData.get("contract_type") ?? "");
  if (!title || !["msa", "nda", "ip_agreement", "sow"].includes(contractType)) {
    throw new Error("Enter a title and choose a contract type.");
  }

  const supabase = await createClient();
  const file = formData.get("pdf");
  let signedPdfPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    signedPdfPath = `${orgId}/contracts/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(signedPdfPath, file, { contentType: file.type || undefined });
    if (uploadError) {
      throw new Error(`Couldn't upload PDF: ${uploadError.message}`);
    }
  }

  const { error } = await supabase.from("contracts").insert({
    org_id: orgId,
    project_id: projectId,
    title,
    contract_type: contractType,
    signed_pdf_storage_path: signedPdfPath,
    signing_status: signedPdfPath ? "signed" : "draft",
  });
  if (error) {
    if (signedPdfPath) await supabase.storage.from(BUCKET).remove([signedPdfPath]);
    throw new Error(`Couldn't create contract: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function updateContractStatus(
  contractId: string,
  paths: string[],
  formData: FormData
) {
  await requireAxelAdmin();
  const signingStatus = String(formData.get("signing_status") ?? "draft");

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ signing_status: signingStatus })
    .eq("id", contractId);
  if (error) {
    throw new Error(`Couldn't update contract: ${error.message}`);
  }
  revalidateAll(paths);
}

export async function deleteContract(
  contractId: string,
  signedPdfPath: string | null,
  paths: string[]
) {
  await requireAxelAdmin();
  const supabase = await createClient();

  if (signedPdfPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([signedPdfPath]);
    if (removeError) {
      throw new Error(`Couldn't delete contract PDF: ${removeError.message}`);
    }
  }

  const { error } = await supabase.from("contracts").delete().eq("id", contractId);
  if (error) {
    throw new Error(`Couldn't delete contract: ${error.message}`);
  }
  revalidateAll(paths);
}
