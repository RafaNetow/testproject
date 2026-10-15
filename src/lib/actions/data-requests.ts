"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";
import { detectTechnique, isFileLabel } from "@/lib/techniques";

const BUCKET = "project-files";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
  // The client's summary lists pending requests under "Waiting on you".
  revalidatePath("/portal");
}

export async function createDataRequest(projectId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Say what data you need.");
  if (title.length > 160) throw new Error("Keep the request title under 160 characters.");
  const details = String(formData.get("details") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const folderId = String(formData.get("folder_id") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("data_requests").insert({
    project_id: projectId,
    title,
    details: details || null,
    technique: technique && isFileLabel(technique) ? technique : null,
    folder_id: folderId || null,
    due_date: DATE_RE.test(dueDate) ? dueDate : null,
    requested_by: user.id,
  });
  if (error) throw new Error(`Couldn't add the request: ${error.message}`);

  await recordActivity({ kind: "file", projectId, message: `requested ${quoted(title)}` });
  revalidateAll(paths);
}

export async function deleteDataRequest(requestId: string, paths: string[]) {
  await requireAxelAdmin();
  const doomed = await entityInfo("data_requests", requestId, "title");
  const supabase = await createClient();
  const { error } = await supabase.from("data_requests").delete().eq("id", requestId);
  if (error) throw new Error(`Couldn't remove the request: ${error.message}`);
  await recordActivity({
    kind: "file",
    projectId: doomed.projectId,
    message: `withdrew the request ${quoted(doomed.name)}`,
    adminsOnly: true,
  });
  revalidateAll(paths);
}

/** For data that arrived another way (email, USB) — or to reopen a request. */
export async function setDataRequestReceived(requestId: string, received: boolean, paths: string[]) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("data_requests")
    .update(received ? { status: "received", received_at: new Date().toISOString() } : { status: "requested", received_at: null })
    .eq("id", requestId);
  if (error) throw new Error(`Couldn't update the request: ${error.message}`);
  const request = await entityInfo("data_requests", requestId, "title");
  await recordActivity({
    kind: "file",
    projectId: request.projectId,
    message: received ? `marked ${quoted(request.name)} as received` : `reopened the request ${quoted(request.name)}`,
  });
  revalidateAll(paths);
}

export type FulfillResult = { ok: boolean; message: string };

/** The client's upload into a request's slot: stores the file, then marks the request received. */
export async function fulfillDataRequest(
  requestId: string,
  paths: string[],
  _previous: FulfillResult | null,
  formData: FormData
): Promise<FulfillResult> {
  const user = await requireSessionUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file to upload." };

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("data_requests")
    .select("id, project_id, title, technique, folder_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { ok: false, message: "We couldn't find that request." };

  const storagePath = `${request.project_id}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) return { ok: false, message: `Couldn't upload the file: ${uploadError.message}` };

  const { data: inserted, error: insertError } = await supabase
    .from("files")
    .insert({
      project_id: request.project_id,
      folder_id: request.folder_id,
      storage_path: storagePath,
      filename: file.name,
      size_bytes: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
      technique: request.technique ?? detectTechnique(file.name),
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, message: `Couldn't save the file: ${insertError?.message ?? "unknown error"}` };
  }

  const { error: rpcError } = await supabase.rpc("fulfill_data_request", { p_request: requestId, p_file: inserted.id });
  if (rpcError) return { ok: false, message: "The file was uploaded, but we couldn't mark the request as received." };

  await recordActivity({
    kind: "file",
    projectId: request.project_id,
    message: `uploaded ${quoted(file.name)} for the request ${quoted(request.title)}`,
  });
  revalidateAll(paths);
  return { ok: true, message: `"${file.name}" received — thank you.` };
}
