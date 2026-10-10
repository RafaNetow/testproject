"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";
import { createEnvelope, distributeEnvelope } from "@/lib/documenso";

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
  await recordActivity({
    kind: "contract",
    projectId,
    orgId,
    message: signedPdfPath ? `added the signed contract ${quoted(title)}` : `drafted the contract ${quoted(title)}`,
    adminsOnly: !signedPdfPath,
  });
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
  const contract = await entityInfo("contracts", contractId, "title");
  const words: Record<string, string> = { draft: "a draft", sent: "sent", partially_signed: "partially signed", signed: "signed", paid: "paid", overdue: "overdue", cancelled: "cancelled" };
  await recordActivity({
    kind: "contract",
    projectId: contract.projectId,
    message: `marked the contract ${quoted(contract.name)} as ${words[signingStatus] ?? signingStatus}`,
    adminsOnly: signingStatus === "draft",
  });
  revalidateAll(paths);
}

export type SendForSignatureResult = {
  success: boolean;
  message?: string;
};

/**
 * Sends an unsigned PDF out for real e-signature via Documenso, instead of
 * the manual "upload an already-signed PDF" path in createContract. Only
 * usable on a draft contract that hasn't already been sent. Returns a result
 * rather than throwing — a call to an external API fails in more ways than a
 * database write, and the admin needs to actually see whether it worked.
 */
export async function sendContractForSignature(
  contractId: string,
  orgId: string,
  paths: string[],
  _prevState: SendForSignatureResult | null,
  formData: FormData
): Promise<SendForSignatureResult> {
  await requireAxelAdmin();

  const recipientName = String(formData.get("recipient_name") ?? "").trim();
  const recipientEmail = String(formData.get("recipient_email") ?? "").trim();
  const file = formData.get("pdf");
  if (!recipientName || !recipientEmail) {
    return { success: false, message: "Enter the signer's name and email." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose the unsigned PDF to send." };
  }

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("title, org_id, organizations(name)")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract || contract.org_id !== orgId) {
    return { success: false, message: "Contract not found." };
  }
  const orgName = (contract.organizations as unknown as { name: string } | null)?.name ?? "you";

  let created;
  let sent;
  try {
    created = await createEnvelope({
      title: contract.title,
      externalId: contractId,
      file,
      recipientName,
      recipientEmail,
      subject: `Please sign: ${contract.title}`,
      message: `Hi ${recipientName}, please review and sign this document on behalf of ${orgName}.`,
    });
    sent = await distributeEnvelope(created.id);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Couldn't reach Documenso.",
    };
  }

  const signingUrl = sent.recipients[0]?.signingUrl ?? null;

  const { error } = await supabase
    .from("contracts")
    .update({
      documenso_document_id: created.id,
      documenso_signing_url: signingUrl,
      signing_status: "sent",
    })
    .eq("id", contractId);
  if (error) {
    return {
      success: false,
      message: `Sent, but couldn't save the tracking info: ${error.message}`,
    };
  }
  const sentContract = await entityInfo("contracts", contractId, "title");
  await recordActivity({
    kind: "contract",
    projectId: sentContract.projectId,
    orgId,
    message: `sent ${quoted(contract.title)} to ${recipientName} for signature`,
  });
  revalidateAll(paths);
  return { success: true, message: `Sent to ${recipientEmail} for signature.` };
}

export async function deleteContract(
  contractId: string,
  signedPdfPath: string | null,
  paths: string[]
) {
  await requireAxelAdmin();
  const [doomed, doomedStatus] = await Promise.all([
    entityInfo("contracts", contractId, "title"),
    entityInfo("contracts", contractId, "signing_status"),
  ]);
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
  await recordActivity({
    kind: "contract",
    projectId: doomed.projectId,
    message: `deleted the contract ${quoted(doomed.name)}`,
    adminsOnly: doomedStatus.name === "draft",
  });
  revalidateAll(paths);
}
