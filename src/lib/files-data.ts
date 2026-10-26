import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireSessionUser } from "@/lib/dal";
import type { DataRequestRow } from "@/components/files/data-requests";

const BUCKET = "project-files";

/**
 * Everything the Files page needs for one project: folders, files (with
 * short-lived download links), data requests, the signed-in person's
 * favourites and the uploaders' names. Shared by the portal and admin pages.
 */
export async function loadFilesData(projectId: string) {
  const user = await requireSessionUser();
  const supabase = await createClient();

  const [{ data: folders }, { data: files }, { data: requests }, { data: stars }] = await Promise.all([
    supabase.from("folders").select("id, name, parent_folder_id, created_at").eq("project_id", projectId),
    supabase
      .from("files")
      .select("id, filename, size_bytes, version_tag, created_at, storage_path, folder_id, mime_type, technique, uploaded_by")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("data_requests")
      .select("id, title, details, technique, folder_id, due_date, status, file_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase.from("file_favorites").select("file_id, folder_id").eq("user_id", user.id),
  ]);

  const uploaderIds = [...new Set((files ?? []).map((f) => f.uploaded_by).filter((id): id is string => Boolean(id)))];
  const [{ data: people }, signed] = await Promise.all([
    uploaderIds.length ? supabase.from("profiles").select("id, full_name").in("id", uploaderIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    (files ?? []).length
      ? supabase.storage.from(BUCKET).createSignedUrls((files ?? []).map((f) => f.storage_path), 3600)
      : Promise.resolve({ data: [] as { path: string | null; signedUrl: string }[] }),
  ]);
  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return {
    folders: folders ?? [],
    files: (files ?? []).map((f) => ({ ...f, url: urlByPath.get(f.storage_path) ?? null })),
    requests: (requests ?? []) as DataRequestRow[],
    favourites: {
      files: new Set((stars ?? []).map((s) => s.file_id).filter((id): id is string => Boolean(id))),
      folders: new Set((stars ?? []).map((s) => s.folder_id).filter((id): id is string => Boolean(id))),
    },
    uploaders: new Map((people ?? []).map((p) => [p.id, p.full_name ?? "Someone"])),
  };
}
