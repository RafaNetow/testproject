"use client";

import { useRef } from "react";
import { Eye, X } from "@phosphor-icons/react/dist/ssr";

export function FilePreviewDialog({
  filename,
  url,
  mimeType,
}: {
  filename: string;
  url: string;
  mimeType: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
        title="Preview"
        aria-label={`Preview "${filename}"`}
      >
        <Eye size={16} />
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[90dvh] w-full max-w-3xl rounded-2xl border border-border bg-card p-0 backdrop:bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="truncate text-sm font-medium text-primary">{filename}</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[calc(90dvh-3.5rem)] overflow-auto p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={filename} className="mx-auto max-w-full rounded-lg" />
          ) : (
            <iframe src={url} title={filename} className="h-[75dvh] w-full rounded-lg border border-border" />
          )}
        </div>
      </dialog>
    </>
  );
}
