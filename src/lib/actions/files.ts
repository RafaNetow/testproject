"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser, requireAxelAdmin, isAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, entityInfo, quoted } from "@/lib/activity";
import { notifyAxel } from "@/lib/notify-axel";
import { detectTechnique, isFileLabel } from "@/lib/techniques";

const BUCKET = "project-files";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export type UploadResult = {
  success: boolean;
  message?: string;
};

export async function uploadFile(
  projectId: string,
  folderId: string | null,
  paths: string[],
  formData: FormData
): Promise<UploadResult> {
  const user = await requireSessionUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose a file to upload." };
  }

  const supabase = await createClient();
  const storagePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) {
    return { success: false, message: `Couldn't upload file: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("files").insert({
    project_id: projectId,
    folder_id: folderId,
    storage_path: storagePath,
    filename: file.name,
    size_bytes: file.size,
    mime_type: file.type || null,
    uploaded_by: user.id,
    technique: detectTechnique(file.name),
  });
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { success: false, message: `Couldn't save file record: ${insertError.message}` };
  }

  await recordActivity({ kind: "file", projectId, message: `uploaded ${quoted(file.name)}` });

  if (!(await isAxelAdmin())) {
    const { data: project } = await supabase
      .from("projects")
      .select("name, organizations(name)")
      .eq("id", projectId)
      .maybeSingle();
    const orgName = (project?.organizations as unknown as { name: string } | null)?.name;
    await notifyAxel(`New file uploaded${orgName ? ` — ${orgName}` : ""}`, [
      `"${file.name}" was uploaded to ${project?.name ?? "a project"}${orgName ? ` (${orgName})` : ""}.`,
    ]);
  }

  revalidateAll(paths);
  return { success: true, message: `"${file.name}" uploaded.` };
}

/** Renames a file's display name only — the underlying storage path is untouched. */
export async function renameFile(fileId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const filename = String(formData.get("filename") ?? "").trim();
  if (!filename) {
    throw new Error("File name is required.");
  }

  const previous = await entityInfo("files", fileId, "filename");
  if (previous.name === filename) return;
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ filename }).eq("id", fileId);
  if (error) {
    throw new Error(`Couldn't rename file: ${error.message}`);
  }
  await recordActivity({ kind: "file", projectId: previous.projectId, message: `renamed ${quoted(previous.name)} to ${quoted(filename)}` });
  revalidateAll(paths);
}

export async function deleteFile(fileId: string, storagePath: string, paths: string[]) {
  await requireAxelAdmin();
  const doomed = await entityInfo("files", fileId, "filename");
  const supabase = await createClient();

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (removeError) {
    throw new Error(`Couldn't delete file from storage: ${removeError.message}`);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) {
    throw new Error(`Couldn't delete file record: ${error.message}`);
  }

  await recordActivity({ kind: "file", projectId: doomed.projectId, message: `deleted ${quoted(doomed.name)}` });
  revalidateAll(paths);
}

/** Corrects a file's technique / document-kind label (empty clears it). */
export async function setFileTechnique(fileId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const raw = String(formData.get("technique") ?? "").trim();
  if (raw && !isFileLabel(raw)) throw new Error("That label isn't one of the known techniques.");
  const technique = raw || null;

  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ technique }).eq("id", fileId);
  if (error) throw new Error(`Couldn't update the label: ${error.message}`);

  const file = await entityInfo("files", fileId, "filename");
  await recordActivity({
    kind: "file",
    projectId: file.projectId,
    message: technique ? `tagged ${quoted(file.name)} as ${technique}` : `removed the label from ${quoted(file.name)}`,
  });
  revalidateAll(paths);
}

/** Moves a file to a different folder (or back to the top level if folderId is null). */
export async function moveFile(fileId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const raw = String(formData.get("folder_id") ?? "");
  const folderId = raw === "__root__" ? null : raw;

  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ folder_id: folderId }).eq("id", fileId);
  if (error) {
    throw new Error(`Couldn't move file: ${error.message}`);
  }
  const [file, folder] = await Promise.all([
    entityInfo("files", fileId, "filename"),
    folderId ? entityInfo("folders", folderId, "name") : Promise.resolve({ projectId: null, name: null }),
  ]);
  await recordActivity({
    kind: "file",
    projectId: file.projectId,
    message: `moved ${quoted(file.name)} to ${folder.name ? quoted(folder.name) : "the top level"}`,
  });
  revalidateAll(paths);
}

export async function createFolder(
  projectId: string,
  parentFolderId: string | null,
  paths: string[],
  formData: FormData
) {
  await requireAxelAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Folder name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("folders").insert({
    project_id: projectId,
    parent_folder_id: parentFolderId,
    name,
  });
  if (error) {
    throw new Error(`Couldn't create folder: ${error.message}`);
  }
  await recordActivity({ kind: "file", projectId, message: `created the folder ${quoted(name)}` });
  revalidateAll(paths);
}

export async function renameFolder(folderId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Folder name is required.");
  }

  const previous = await entityInfo("folders", folderId, "name");
  if (previous.name === name) return;
  const supabase = await createClient();
  const { error } = await supabase.from("folders").update({ name }).eq("id", folderId);
  if (error) {
    throw new Error(`Couldn't rename folder: ${error.message}`);
  }
  await recordActivity({ kind: "file", projectId: previous.projectId, message: `renamed the folder ${quoted(previous.name)} to ${quoted(name)}` });
  revalidateAll(paths);
}

/** Stars or unstars a file or folder for the signed-in person (RLS keeps it to items they can see). */
export async function toggleFavorite(kind: "file" | "folder", id: string, paths: string[]): Promise<{ starred: boolean }> {
  const user = await requireSessionUser();
  const supabase = await createClient();
  const column = kind === "file" ? "file_id" : "folder_id";
  const { data: existing } = await supabase.from("file_favorites").select("id").eq("user_id", user.id).eq(column, id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("file_favorites").delete().eq("id", existing.id);
    if (error) throw new Error(`Couldn't remove the star: ${error.message}`);
  } else {
    const { error } = await supabase.from("file_favorites").insert({ user_id: user.id, [column]: id });
    if (error) throw new Error(`Couldn't star it: ${error.message}`);
  }
  revalidateAll(paths);
  return { starred: !existing };
}

/** Admin: moves several files at once (null = the top level). */
export async function moveFiles(fileIds: string[], folderId: string | null, paths: string[]) {
  await requireAxelAdmin();
  if (!fileIds.length) return;
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ folder_id: folderId }).in("id", fileIds);
  if (error) throw new Error(`Couldn't move the files: ${error.message}`);
  const [first, folder] = await Promise.all([
    entityInfo("files", fileIds[0], "filename"),
    folderId ? entityInfo("folders", folderId, "name") : Promise.resolve({ projectId: null, name: null }),
  ]);
  await recordActivity({
    kind: "file",
    projectId: first.projectId,
    message: `moved ${fileIds.length === 1 ? quoted(first.name) : `${fileIds.length} files`} to ${folder.name ? quoted(folder.name) : "the top level"}`,
  });
  revalidateAll(paths);
}

/** Admin: deletes several files at once, storage objects first. */
export async function deleteFiles(fileIds: string[], paths: string[]) {
  await requireAxelAdmin();
  if (!fileIds.length) return;
  const supabase = await createClient();
  const { data: rows, error: readError } = await supabase.from("files").select("id, filename, storage_path, project_id").in("id", fileIds);
  if (readError) throw new Error(`Couldn't read the files: ${readError.message}`);
  if (!rows?.length) return;
  const { error: removeError } = await supabase.storage.from(BUCKET).remove(rows.map((r) => r.storage_path));
  if (removeError) throw new Error(`Couldn't delete the files from storage: ${removeError.message}`);
  const { error } = await supabase.from("files").delete().in("id", rows.map((r) => r.id));
  if (error) throw new Error(`Couldn't delete the file records: ${error.message}`);
  await recordActivity({
    kind: "file",
    projectId: rows[0].project_id,
    message: rows.length === 1 ? `deleted ${quoted(rows[0].filename)}` : `deleted ${rows.length} files`,
  });
  revalidateAll(paths);
}

/** Deleting a folder cascades to its subfolders; files inside move to the top level. */
export async function deleteFolder(folderId: string, paths: string[]) {
  await requireAxelAdmin();
  const doomed = await entityInfo("folders", folderId, "name");
  const supabase = await createClient();
  const { error } = await supabase.from("folders").delete().eq("id", folderId);
  if (error) {
    throw new Error(`Couldn't delete folder: ${error.message}`);
  }
  await recordActivity({ kind: "file", projectId: doomed.projectId, message: `deleted the folder ${quoted(doomed.name)}` });
  revalidateAll(paths);
}
