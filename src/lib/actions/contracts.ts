"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAxel } from "@/lib/notify-axel";
import { sha256Hex, stampCertificate } from "@/lib/signing";
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

const safeName = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80) || "contract.pdf";

/**
 * Sends an unsigned PDF to be signed inside the portal (no external service):
 * the workspace owner gets a notification, reviews it and signs. Only for a
 * draft contract.
 */
export async function sendContractForPortalSigning(
  contractId: string,
  orgId: string,
  paths: string[],
  _prevState: SendForSignatureResult | null,
  formData: FormData
): Promise<SendForSignatureResult> {
  await requireAxelAdmin();
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return { success: false, message: "Choose the unsigned PDF to send." };
  if (file.type && file.type !== "application/pdf") return { success: false, message: "The contract must be a PDF." };

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("title, org_id, project_id, signing_status")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract || contract.org_id !== orgId) return { success: false, message: "Contract not found." };
  if (contract.signing_status !== "draft") return { success: false, message: "This contract was already sent." };

  const path = `${orgId}/contracts/${crypto.randomUUID()}-unsigned-${safeName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf" });
  if (uploadError) return { success: false, message: `Couldn't upload the PDF: ${uploadError.message}` };

  const { error } = await supabase
    .from("contracts")
    .update({ unsigned_pdf_storage_path: path, signing_method: "portal", signing_status: "sent" })
    .eq("id", contractId);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { success: false, message: `Couldn't send the contract: ${error.message}` };
  }

  await recordActivity({
    kind: "contract",
    projectId: contract.project_id,
    orgId,
    message: `sent ${quoted(contract.title)} for your signature`,
  });
  revalidateAll([...paths, "/portal/contracts", "/portal"]);
  return { success: true, message: "Sent. The workspace owner can review and sign it in their portal." };
}

export type SignContractResult = { success: boolean; message?: string };

/**
 * The workspace owner signs a contract in the portal. Everything is checked
 * with the owner's own session: RLS only returns a contract to its own
 * organisation's owner, and the final status change goes through
 * complete_portal_signature(). The service-role client is used for one thing
 * only — filing the signed PDF — at a path built from the contract's own
 * organisation id, never from anything the caller sent.
 */
export async function signContract(
  contractId: string,
  paths: string[],
  _prevState: SignContractResult | null,
  formData: FormData
): Promise<SignContractResult> {
  const user = await requireSessionUser();
  const name = String(formData.get("full_name") ?? "").trim();
  if (name.length < 3) return { success: false, message: "Type your full name to sign." };
  if (formData.get("agree") !== "on") return { success: false, message: "Please confirm that you have read the contract and agree to it." };

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, title, org_id, project_id, signing_status, signing_method, unsigned_pdf_storage_path, organizations(name)")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return { success: false, message: "We couldn't find that contract." };
  if (contract.signing_status !== "sent" || contract.signing_method !== "portal" || !contract.unsigned_pdf_storage_path) {
    return { success: false, message: "This contract isn't waiting for your signature." };
  }

  const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(contract.unsigned_pdf_storage_path);
  if (downloadError || !blob) return { success: false, message: "We couldn't open the contract PDF. Please try again." };
  const original = new Uint8Array(await blob.arrayBuffer());

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim().replace(/^::ffff:/, "");
  const userAgent = h.get("user-agent") ?? "";
  const hash = sha256Hex(original);
  const signedAt = new Date();

  let stamped: Uint8Array;
  try {
    stamped = await stampCertificate(original, {
      contractId: contract.id,
      title: contract.title,
      signerName: name,
      signerAccount: user.email ?? "unknown",
      signedAt,
      ip,
      userAgent,
      hash,
    });
  } catch {
    return { success: false, message: "We couldn't prepare the signed copy. Is the file a valid PDF?" };
  }

  const signedPath = `${contract.org_id}/contracts/${crypto.randomUUID()}-signed.pdf`;
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(signedPath, Buffer.from(stamped), { contentType: "application/pdf" });
  if (uploadError) return { success: false, message: "We couldn't save the signed copy. Please try again." };

  const { error } = await supabase.rpc("complete_portal_signature", {
    p_contract: contractId,
    p_signer_name: name,
    p_hash: hash,
    p_signed_path: signedPath,
    p_meta: { ip, user_agent: userAgent.slice(0, 300), signed_at: signedAt.toISOString(), account: user.email ?? null },
  });
  if (error) {
    await admin.storage.from(BUCKET).remove([signedPath]);
    return { success: false, message: error.message.replace(/^.*?:s*/, "") || "We couldn't record your signature." };
  }

  await recordActivity({ kind: "contract", projectId: contract.project_id, orgId: contract.org_id, message: `signed the contract ${quoted(contract.title)}` });
  const orgName = (contract.organizations as unknown as { name: string } | null)?.name;
  await notifyAxel(`Contract signed${orgName ? ` — ${orgName}` : ""}`, [`"${contract.title}" was signed by ${name} in the portal.`]);
  revalidateAll([...paths, "/portal", `/admin/clients/${contract.org_id}/projects/${contract.project_id}/contracts`, "/admin/contracts"]);
  return { success: true, message: "Signed. A copy with the signature certificate is now in your contracts." };
}
