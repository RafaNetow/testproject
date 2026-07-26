"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser, requireAxelAdmin, isAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyAxel } from "@/lib/notify-axel";

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
  });
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { success: false, message: `Couldn't save file record: ${insertError.message}` };
  }

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

export async function deleteFile(fileId: string, storagePath: string, paths: string[]) {
  await requireAxelAdmin();
  const supabase = await createClient();

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (removeError) {
    throw new Error(`Couldn't delete file from storage: ${removeError.message}`);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) {
    throw new Error(`Couldn't delete file record: ${error.message}`);
  }

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
  revalidateAll(paths);
}

export async function renameFolder(folderId: string, paths: string[], formData: FormData) {
  await requireAxelAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Folder name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("folders").update({ name }).eq("id", folderId);
  if (error) {
    throw new Error(`Couldn't rename folder: ${error.message}`);
  }
  revalidateAll(paths);
}

/** Deleting a folder cascades to its subfolders; files inside move to the top level. */
export async function deleteFolder(folderId: string, paths: string[]) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("folders").delete().eq("id", folderId);
  if (error) {
    throw new Error(`Couldn't delete folder: ${error.message}`);
  }
  revalidateAll(paths);
}
