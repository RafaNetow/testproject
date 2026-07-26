import Link from "next/link";
import {
  CaretRight,
  DownloadSimple,
  FilePlus,
  FileText,
  FolderPlus,
  FolderSimple,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { UploadForm } from "./upload-form";
import { FilePreviewDialog } from "./file-preview-dialog";
import { RenameButton } from "./rename-button";
import {
  createFolder,
  deleteFolder,
  deleteFile,
  moveFile,
  renameFolder,
  renameFile,
} from "@/lib/actions/files";

type FolderRow = { id: string; name: string; parent_folder_id: string | null };
type FileRow = {
  id: string;
  filename: string;
  size_bytes: number;
  version_tag: string | null;
  created_at: string;
  storage_path: string;
  folder_id: string | null;
  mime_type: string | null;
  url: string | null;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function folderHref(basePath: string, extraQuery: string | undefined, folderId: string | null) {
  const params = new URLSearchParams(extraQuery);
  if (folderId) {
    params.set("folder", folderId);
  } else {
    params.delete("folder");
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function FolderTree({
  folders,
  fileCountByFolder,
  parentId,
  depth,
  currentFolderId,
  basePath,
  extraQuery,
}: {
  folders: FolderRow[];
  fileCountByFolder: Map<string, number>;
  parentId: string | null;
  depth: number;
  currentFolderId: string | null;
  basePath: string;
  extraQuery?: string;
}) {
  const children = folders
    .filter((f) => (f.parent_folder_id ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!children.length) return null;

  return (
    <ul className="flex flex-col gap-0.5">
      {children.map((f) => {
        const isActive = f.id === currentFolderId;
        return (
          <li key={f.id}>
            <Link
              href={folderHref(basePath, extraQuery, f.id)}
              title={f.name}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
              className={`flex items-center gap-2 rounded-lg py-1.5 pr-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-secondary hover:bg-muted hover:text-primary"
              }`}
            >
              <FolderSimple
                size={15}
                weight={isActive ? "fill" : "regular"}
                className={`shrink-0 ${isActive ? "text-accent" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {fileCountByFolder.get(f.id) ?? 0}
              </span>
            </Link>
            <FolderTree
              folders={folders}
              fileCountByFolder={fileCountByFolder}
              parentId={f.id}
              depth={depth + 1}
              currentFolderId={currentFolderId}
              basePath={basePath}
              extraQuery={extraQuery}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function FilesView({
  projectId,
  folders,
  files,
  currentFolderId,
  basePath,
  extraQuery,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  folders: FolderRow[];
  files: FileRow[];
  currentFolderId: string | null;
  basePath: string;
  extraQuery?: string;
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const breadcrumb: FolderRow[] = [];
  for (let cur = currentFolderId; cur; ) {
    const f = byId.get(cur);
    if (!f) break;
    breadcrumb.unshift(f);
    cur = f.parent_folder_id;
  }

  const subfolders = folders.filter((f) => (f.parent_folder_id ?? null) === currentFolderId);
  const filesHere = files.filter((f) => (f.folder_id ?? null) === currentFolderId);
  const createInThisFolder = createFolder.bind(null, projectId, currentFolderId, revalidatePaths);

  const moveOptions = [
    { value: "__root__", label: "Top level" },
    ...folders
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ value: f.id, label: f.name })),
  ];

  // Recursive file count per folder (includes files in nested subfolders),
  // computed bottom-up so the sidebar tree can show "how much is really in
  // here" at a glance instead of just direct children.
  const directCount = new Map<string, number>();
  for (const f of files) {
    if (f.folder_id) directCount.set(f.folder_id, (directCount.get(f.folder_id) ?? 0) + 1);
  }
  const childrenOf = new Map<string | null, FolderRow[]>();
  for (const f of folders) {
    const key = f.parent_folder_id ?? null;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), f]);
  }
  const fileCountByFolder = new Map<string, number>();
  function countFolder(folderId: string): number {
    if (fileCountByFolder.has(folderId)) return fileCountByFolder.get(folderId)!;
    let total = directCount.get(folderId) ?? 0;
    for (const child of childrenOf.get(folderId) ?? []) {
      total += countFolder(child.id);
    }
    fileCountByFolder.set(folderId, total);
    return total;
  }
  for (const f of folders) countFolder(f.id);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr] lg:items-start lg:gap-8">
      <nav
        aria-label="Folder tree"
        className="rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-6"
      >
        <Link
          href={folderHref(basePath, extraQuery, null)}
          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
            !currentFolderId
              ? "bg-accent/10 font-medium text-accent"
              : "text-secondary hover:bg-muted hover:text-primary"
          }`}
        >
          <FolderSimple
            size={15}
            weight={!currentFolderId ? "fill" : "regular"}
            className={`shrink-0 ${!currentFolderId ? "text-accent" : "text-muted-foreground"}`}
          />
          <span className="min-w-0 flex-1 truncate">All files</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {files.length}
          </span>
        </Link>
        <FolderTree
          folders={folders}
          fileCountByFolder={fileCountByFolder}
          parentId={null}
          depth={1}
          currentFolderId={currentFolderId}
          basePath={basePath}
          extraQuery={extraQuery}
        />
      </nav>

      <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm">
        <Link
          href={folderHref(basePath, extraQuery, null)}
          className={`transition-colors ${
            currentFolderId ? "text-muted-foreground hover:text-primary" : "font-medium text-primary"
          }`}
        >
          Files
        </Link>
        {breadcrumb.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1.5">
            <CaretRight size={12} className="text-muted-foreground" />
            <Link
              href={folderHref(basePath, extraQuery, f.id)}
              className={`transition-colors ${
                i === breadcrumb.length - 1
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {f.name}
            </Link>
          </span>
        ))}
      </nav>

      {canManage && (
        <form action={createInThisFolder} className="flex items-end gap-2">
          <input
            name="name"
            required
            placeholder="New folder name"
            className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-secondary transition-colors hover:bg-muted"
          >
            <FolderPlus size={15} />
            New folder
          </button>
        </form>
      )}

      {subfolders.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subfolders.map((f) => {
            const deleteThis = deleteFolder.bind(null, f.id, revalidatePaths);
            const renameThis = renameFolder.bind(null, f.id, revalidatePaths);
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3"
              >
                <Link
                  href={folderHref(basePath, extraQuery, f.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium text-primary"
                >
                  <FolderSimple size={18} weight="fill" className="shrink-0 text-accent" />
                  <span className="truncate">{f.name}</span>
                </Link>
                {canManage && (
                  <form action={renameThis}>
                    <RenameButton
                      fieldName="name"
                      currentValue={f.name}
                      promptText="Rename folder"
                      ariaLabel={`Rename folder ${f.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                    />
                  </form>
                )}
                {canManage && (
                  <form action={deleteThis}>
                    <ConfirmButton
                      confirmText={`Delete "${f.name}"? Any subfolders go with it, and files inside move to the top level.`}
                      ariaLabel={`Delete folder ${f.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash size={13} />
                    </ConfirmButton>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <UploadForm projectId={projectId} folderId={currentFolderId} revalidatePaths={revalidatePaths} />

      {!filesHere.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <FilePlus size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {subfolders.length ? "No files at this level." : "No files or folders yet."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {filesHere.map((f) => {
            const deleteThis = deleteFile.bind(null, f.id, f.storage_path, revalidatePaths);
            const moveThis = moveFile.bind(null, f.id, revalidatePaths);
            const renameThis = renameFile.bind(null, f.id, revalidatePaths);
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={20} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">{f.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString("en-GB")}
                      {f.version_tag ? ` · ${f.version_tag}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {canManage && (
                    <form action={moveThis}>
                      <AutoSubmitSelect
                        name="folder_id"
                        defaultValue={f.folder_id ?? "__root__"}
                        options={moveOptions}
                        className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                      />
                    </form>
                  )}
                  {f.url && (
                    <>
                      <FilePreviewDialog filename={f.filename} url={f.url} mimeType={f.mime_type} />
                      <a
                        href={f.url}
                        download={f.filename}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                        title="Download"
                        aria-label={`Download "${f.filename}"`}
                      >
                        <DownloadSimple size={16} />
                      </a>
                    </>
                  )}
                  {canManage && (
                    <form action={renameThis}>
                      <RenameButton
                        fieldName="filename"
                        currentValue={f.filename}
                        promptText="Rename file"
                        ariaLabel={`Rename file ${f.filename}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                      />
                    </form>
                  )}
                  {canManage && (
                    <form action={deleteThis}>
                      <ConfirmButton
                        confirmText={`Delete "${f.filename}"? This can't be undone.`}
                        ariaLabel={`Delete file "${f.filename}"`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash size={15} />
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
