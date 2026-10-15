"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { uploadFile, type UploadResult } from "@/lib/actions/files";
import { CloudUploadOutlined } from "@/components/icons";

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
      {/* Keyed on the last result so the dropzone (and its chosen file) reset after each upload. */}
      <Dropzone key={state?.message ?? "initial"} isPending={isPending} />
      {state && (
        <Alert severity={state.success ? "success" : "error"} variant="outlined" role="status">
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}

/**
 * A Minimal-style dashed dropzone. The native file input is stretched,
 * invisibly, over the whole zone — so clicking opens the picker and dropping
 * a file works natively, with no drag-and-drop JavaScript.
 */
function Dropzone({ isPending }: { isPending: boolean }) {
  const [chosen, setChosen] = useState("");
  const [dragging, setDragging] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        gap: 2.5,
        px: 3,
        py: 3,
        borderRadius: 2,
        border: "1px dashed var(--border-dashed)",
        bgcolor: dragging ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "var(--color-muted)",
        borderColor: dragging ? "primary.main" : undefined,
        transition: "background-color 150ms, border-color 150ms",
        "&:hover": { bgcolor: "color-mix(in srgb, var(--color-accent) 6%, var(--color-muted))" },
      }}
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          color: "primary.main",
        }}
      >
        <CloudUploadOutlined sx={{ fontSize: 28 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: "center", sm: "left" } }}>
        <Typography noWrap sx={{ fontSize: 16, fontWeight: 600 }}>
          {chosen || "Drop or select a file"}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.secondary" }}>
          {chosen ? "Ready to upload to this folder." : (
            <>
              Drop it here or{" "}
              <Box component="span" sx={{ color: "primary.main", textDecoration: "underline" }}>
                browse
              </Box>{" "}
              your computer.
            </>
          )}
        </Typography>
      </Box>
      <Box
        component="input"
        type="file"
        name="file"
        required
        aria-label="Choose a file to upload"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setChosen(e.target.files?.[0]?.name ?? "")}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
      {chosen && (
        // Sits above the invisible input so it stays clickable.
        <Button type="submit" variant="contained" disabled={isPending} sx={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
          {isPending ? "Uploading…" : "Upload"}
        </Button>
      )}
    </Box>
  );
}
