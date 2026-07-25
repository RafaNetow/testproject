import { DownloadSimple, FileText, Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteFile } from "@/lib/actions/files";
import { UploadForm } from "./upload-form";

type FileRow = {
  id: string;
  filename: string;
  size_bytes: number;
  version_tag: string | null;
  created_at: string;
  storage_path: string;
  url: string | null;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesView({
  projectId,
  files,
  revalidatePaths,
  canDelete,
}: {
  projectId: string;
  files: FileRow[];
  revalidatePaths: string[];
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <UploadForm projectId={projectId} revalidatePaths={revalidatePaths} />

      {!files.length ? (
        <p className="text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {files.map((f) => {
            const deleteThis = deleteFile.bind(null, f.id, f.storage_path, revalidatePaths);
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={20} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">{f.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString()}
                      {f.version_tag ? ` · ${f.version_tag}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {f.url && (
                    <a
                      href={f.url}
                      download={f.filename}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                      title="Download"
                      aria-label={`Download "${f.filename}"`}
                    >
                      <DownloadSimple size={16} />
                    </a>
                  )}
                  {canDelete && (
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
  );
}
