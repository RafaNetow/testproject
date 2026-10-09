"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { FileInput } from "@/components/shared/file-input";
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
    <Stack component="form" action={formAction} spacing={1.5}>
      <Paper variant="outlined" sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, p: 2.5 }}>
        {/* Keyed on the last result so the picker (and its label) reset after each upload. */}
        <FileInput key={state?.message ?? "initial"} name="file" label="Upload a file" required />
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Uploading…" : "Upload"}
        </Button>
      </Paper>

      {state && (
        <Alert severity={state.success ? "success" : "error"} variant="outlined" role="status">
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}
