import { loadFilesData } from "@/lib/files-data";
import { FilesView } from "@/components/files/files-view";

export default async function AdminProjectFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
  searchParams: Promise<{ folder?: string; technique?: string; file?: string }>;
}) {
  const { orgId, projectId } = await params;
  const { folder, technique, file } = await searchParams;
  const data = await loadFilesData(projectId);
  const base = `/admin/clients/${orgId}/projects/${projectId}/files`;

  return (
    <FilesView
      projectId={projectId}
      {...data}
      currentFolderId={folder ?? null}
      technique={technique ?? null}
      openFileId={file ?? null}
      basePath={base}
      revalidatePaths={[base]}
      canManage
    />
  );
}
