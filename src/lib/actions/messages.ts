"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, quoted } from "@/lib/activity";
import { detectTechnique } from "@/lib/techniques";
import { logDecision } from "@/lib/actions/decisions";

const BUCKET = "project-files";
const MAX_BODY = 4000;

export type SendResult = { ok: boolean; message?: string };

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
  // The client's summary shows "Axel sent you a message" under Waiting on you.
  revalidatePath("/portal");
  revalidatePath("/admin/messages");
}

/** A short single-line excerpt for notifications, titles and previews. */
function excerpt(text: string, max = 80) {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

async function uploadAttachment(projectId: string, file: File, userId: string) {
  const supabase = await createClient();
  const { data: folderId, error: folderError } = await supabase.rpc("ensure_chat_folder", { p_project: projectId });
  if (folderError) throw new Error("Couldn't prepare the attachments folder.");

  const storagePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Couldn't upload the file: ${uploadError.message}`);

  const { data: inserted, error: insertError } = await supabase
    .from("files")
    .insert({
      project_id: projectId,
      folder_id: folderId as string,
      storage_path: storagePath,
      filename: file.name,
      size_bytes: file.size,
      mime_type: file.type || null,
      uploaded_by: userId,
      technique: detectTechnique(file.name),
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Couldn't save the file: ${insertError?.message ?? "unknown error"}`);
  }
  return inserted.id as string;
}

/** Posts to the project's thread; an attachment is filed under Files › Chat attachments. */
export async function sendMessage(
  projectId: string,
  paths: string[],
  _previous: SendResult | null,
  formData: FormData
): Promise<SendResult> {
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!body && !hasFile) return { ok: false, message: "Write a message or attach a file." };
  if (body.length > MAX_BODY) return { ok: false, message: `Keep messages under ${MAX_BODY} characters.` };

  let fileId: string | null = null;
  try {
    if (hasFile) fileId = await uploadAttachment(projectId, file, user.id);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Couldn't attach the file." };
  }

  const supabase = await createClient();
  const text = body || `Shared ${(file as File).name}`;
  const { error } = await supabase.from("messages").insert({ project_id: projectId, author_id: user.id, body: text, file_id: fileId });
  if (error) return { ok: false, message: `Couldn't send the message: ${error.message}` };

  // Writing in a thread means you've read it.
  await supabase.from("message_reads").upsert({ project_id: projectId, user_id: user.id, last_read_at: new Date().toISOString() });

  await recordActivity({ kind: "message", projectId, message: `sent a message: ${quoted(excerpt(text))}` });
  revalidateAll(paths);
  return { ok: true };
}

/** Records that the current user has read the thread up to now. */
export async function markThreadRead(projectId: string) {
  const user = await requireSessionUser();
  const supabase = await createClient();
  await supabase.from("message_reads").upsert({ project_id: projectId, user_id: user.id, last_read_at: new Date().toISOString() });
  revalidatePath("/portal");
  revalidatePath("/admin/messages");
}

async function getMessage(messageId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("id, project_id, body").eq("id", messageId).maybeSingle();
  if (!data) throw new Error("Message not found.");
  return data;
}

async function postNote(projectId: string, body: string) {
  const user = await requireSessionUser();
  const supabase = await createClient();
  await supabase.from("messages").insert({ project_id: projectId, author_id: user.id, body });
}

/** Admin: turn an agreement in the chat into an entry in the decisions log. */
export async function messageToDecision(messageId: string, paths: string[]) {
  await requireAxelAdmin();
  const message = await getMessage(messageId);
  const form = new FormData();
  form.set("title", excerpt(message.body, 120));
  form.set("body", message.body);
  await logDecision(message.project_id, paths, form);
  await postNote(message.project_id, `Logged as a decision: ${quoted(excerpt(message.body, 120))}`);
  revalidateAll(paths);
}

/** Admin: turn a request in the chat into a card in the board's first column. */
export async function messageToCard(messageId: string, paths: string[]) {
  await requireAxelAdmin();
  const message = await getMessage(messageId);
  const supabase = await createClient();
  const { data: column } = await supabase
    .from("board_columns")
    .select("id, name")
    .eq("project_id", message.project_id)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (!column) throw new Error("This project has no board columns yet.");

  const { count } = await supabase.from("board_cards").select("id", { count: "exact", head: true }).eq("column_id", column.id);
  const title = excerpt(message.body, 120);
  const { error } = await supabase.from("board_cards").insert({
    project_id: message.project_id,
    column_id: column.id,
    title,
    description: message.body,
    position: count ?? 0,
  });
  if (error) throw new Error(`Couldn't add the card: ${error.message}`);

  await recordActivity({ kind: "card", projectId: message.project_id, message: `added ${quoted(title)} to ${column.name} from the chat` });
  await postNote(message.project_id, `Added to the board: ${quoted(title)}`);
  revalidateAll(paths);
}
