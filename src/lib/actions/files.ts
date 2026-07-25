"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser, requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

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
