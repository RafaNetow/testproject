"use client";

import { useActionState } from "react";
import { uploadFile, type UploadResult } from "@/lib/actions/files";

export function UploadForm({
  projectId,
  folderId,
  revalidatePaths,
}: {
  projectId: string;
  folderId: string | null;
  revalidatePaths: string[];
}) {
  const [state, formAction, isPending] = useActionState<UploadResult | null, FormData>(
    async (_prevState, formData) => uploadFile(projectId, folderId, revalidatePaths, formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <label htmlFor="file-upload" className="text-sm font-medium text-secondary">
            Upload a file
          </label>
          <input
            id="file-upload"
            name="file"
            type="file"
            required
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </div>

      {state && (
        <p
          role="status"
          className={`text-sm leading-relaxed ${
            state.success ? "text-emerald-700" : "text-destructive"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
