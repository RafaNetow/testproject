import Stack from "@mui/material/Stack";
import { FILE_LABELS } from "@/lib/techniques";
import { folderTotals } from "@/lib/file-manager";
import { DataRequests, type DataRequestRow } from "./data-requests";
import { FileManager, type ManagerFile, type ManagerFolder } from "./file-manager";

type FolderRow = { id: string; name: string; parent_folder_id: string | null; created_at: string };
type FileRow = Omit<ManagerFile, "favourite" | "uploaderName"> & { storage_path: string; uploaded_by: string | null };

/**
 * The Files page body, shared by the portal and the admin project page: the
 * data requests, then the File Manager for the current folder. Prepares the
 * rows on the server (breadcrumb, subfolders with totals, favourites,
 * uploader names); the File Manager does the rest in the browser.
 */
export function FilesView({
  projectId,
  folders,
  files,
  currentFolderId,
  technique,
  requests = [],
  favourites,
  uploaders,
  openFileId,
  basePath,
  extraQuery,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  folders: FolderRow[];
  files: FileRow[];
  currentFolderId: string | null;
  /** Technique to filter by on arrival (?technique=), or null for all. */
  technique?: string | null;
  /** Data Alchemica has asked the client for (shown above the files). */
  requests?: DataRequestRow[];
  /** The signed-in person's starred file and folder ids. */
  favourites: { files: Set<string>; folders: Set<string> };
  /** Uploader id → name. */
  uploaders: Map<string, string>;
  /** A file to open in the details drawer (?file=, from a copied link). */
  openFileId?: string | null;
  basePath: string;
  extraQuery?: string;
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  // A folder id that doesn't exist (stale link) falls back to the top level.
  const folderId = currentFolderId && byId.has(currentFolderId) ? currentFolderId : null;

  const pathOf = (id: string | null) => {
    const chain: FolderRow[] = [];
    for (let cur = id; cur; ) {
      const f = byId.get(cur);
      if (!f || chain.includes(f)) break;
      chain.unshift(f);
      cur = f.parent_folder_id;
    }
    return chain;
  };
  const breadcrumb = pathOf(folderId).map((f) => ({ id: f.id, name: f.name }));
  const totals = folderTotals(folders, files);

  const subfolders: ManagerFolder[] = folders
    .filter((f) => (f.parent_folder_id ?? null) === folderId)
    .map((f) => ({
      id: f.id,
      name: f.name,
      created_at: f.created_at,
      count: totals.get(f.id)?.count ?? 0,
      size: totals.get(f.id)?.size ?? 0,
      favourite: favourites.folders.has(f.id),
    }));

  const filesHere: ManagerFile[] = files
    .filter((f) => (f.folder_id ?? null) === folderId)
    .map(({ storage_path: _path, uploaded_by, ...f }) => {
      void _path;
      return { ...f, favourite: favourites.files.has(f.id), uploaderName: uploaded_by ? (uploaders.get(uploaded_by) ?? null) : null };
    });

  // Only offer techniques that occur here, in the canonical order.
  const techniques = FILE_LABELS.filter((label) => filesHere.some((f) => f.technique === label));

  const moveTargets = folders
    .map((f) => ({ id: f.id, name: f.name, path: pathOf(f.parent_folder_id).map((p) => p.name).join(" / ") || "Top level" }))
    .sort((a, b) => `${a.path}/${a.name}`.localeCompare(`${b.path}/${b.name}`));

  return (
    <Stack spacing={4}>
      <DataRequests
        projectId={projectId}
        requests={requests}
        files={Object.fromEntries(files.map((f) => [f.id, { filename: f.filename, url: f.url }]))}
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        canManage={canManage}
        revalidatePaths={revalidatePaths}
      />
      {/* Keyed by folder so selection, paging and the drawer reset when you move between folders. */}
      <FileManager
        key={folderId ?? "root"}
        projectId={projectId}
        currentFolderId={folderId}
        currentFolderName={breadcrumb.at(-1)?.name ?? "All files"}
        breadcrumb={breadcrumb}
        folders={subfolders}
        files={filesHere}
        moveTargets={moveTargets}
        techniques={techniques}
        initialTechnique={technique ?? null}
        openFileId={openFileId && filesHere.some((f) => f.id === openFileId) ? openFileId : null}
        basePath={basePath}
        extraQuery={extraQuery}
        revalidatePaths={revalidatePaths}
        canManage={canManage}
      />
    </Stack>
  );
}
