import { createClient } from "@/lib/supabase/server";
import { FilesView } from "@/components/files/files-view";

const BUCKET = "project-files";

export default async function AdminProjectFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { orgId, projectId } = await params;
  const { folder } = await searchParams;
  const currentFolderId = folder ?? null;
  const supabase = await createClient();

  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, parent_folder_id")
    .eq("project_id", projectId);

  const { data: files } = await supabase
    .from("files")
    .select("id, filename, size_bytes, version_tag, created_at, storage_path, folder_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
      return { ...f, url: data?.signedUrl ?? null };
    })
  );

  return (
    <FilesView
      projectId={projectId}
      folders={folders ?? []}
      files={filesWithUrls}
      currentFolderId={currentFolderId}
      basePath={`/admin/clients/${orgId}/projects/${projectId}/files`}
      revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/files`]}
      canManage
    />
  );
}
