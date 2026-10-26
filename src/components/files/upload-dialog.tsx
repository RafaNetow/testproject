"use client";

import { useState, type ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check, Close, CloudUploadOutlined, ErrorOutlined } from "@/components/icons";
import { notifySuccess } from "@/components/shared/success-toast";
import { uploadFile } from "@/lib/actions/files";
import { formatSize } from "@/lib/file-manager";
import { FileTypeIcon } from "./file-icons";

type Item = { key: string; file: File; status: "ready" | "uploading" | "done" | "error"; message?: string };

/**
 * Upload, as in Minimal's File Manager: a dropzone that takes several files,
 * the list of what's chosen (each removable), then Upload sends them one by
 * one through the same action as before, showing each file's progress.
 */
export function UploadDialog({
  open,
  onClose,
  projectId,
  folderId,
  folderName,
  revalidatePaths,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  folderId: string | null;
  folderName: string;
  revalidatePaths: string[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = items.some((i) => i.status === "uploading");
  const pending = items.filter((i) => i.status === "ready" || i.status === "error");

  function add(list: FileList | null) {
    if (!list?.length) return;
    const next = Array.from(list).map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, status: "ready" as const }));
    setItems((prev) => [...prev, ...next]);
  }

  function close() {
    if (busy) return;
    setItems([]);
    onClose();
  }

  async function uploadAll() {
    let ok = 0;
    let failed = false;
    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: "uploading" } : i)));
      const form = new FormData();
      form.set("file", item.file);
      const result = await uploadFile(projectId, folderId, revalidatePaths, form).catch((e: unknown) => ({
        success: false,
        message: e instanceof Error ? e.message : "Upload failed.",
      }));
      if (result.success) ok++;
      else failed = true;
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: result.success ? "done" : "error", message: result.message } : i)));
    }
    if (ok) notifySuccess(ok === 1 ? "1 file uploaded" : `${ok} files uploaded`);
    // Close once everything is in; keep the dialog open (with the errors) if something failed.
    if (!failed) {
      setItems([]);
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="upload-title">
      <DialogTitle id="upload-title" sx={{ fontWeight: 700 }}>
        Upload files
        <Typography component="span" sx={{ display: "block", fontSize: 13, fontWeight: 400, color: "text.secondary" }}>
          Into {folderName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 5,
            borderRadius: 2,
            border: "1px dashed var(--border-dashed)",
            borderColor: dragging ? "primary.main" : undefined,
            bgcolor: dragging ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "var(--fill-track)",
            textAlign: "center",
            transition: "background-color 150ms, border-color 150ms",
            "&:hover": { bgcolor: "color-mix(in srgb, var(--color-accent) 6%, var(--fill-track))" },
          }}
        >
          <Box sx={{ display: "grid", placeItems: "center", width: 64, height: 64, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "primary.main" }}>
            <CloudUploadOutlined sx={{ fontSize: 32 }} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Drop or select files</Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Drop files here or{" "}
            <Box component="span" sx={{ color: "primary.main", textDecoration: "underline" }}>
              browse
            </Box>{" "}
            your computer.
          </Typography>
          {/* The native input covers the zone: clicking opens the picker and dropping works natively. */}
          <Box
            component="input"
            type="file"
            multiple
            aria-label="Choose files to upload"
            disabled={busy}
            value=""
            onChange={(e: ChangeEvent<HTMLInputElement>) => add(e.target.files)}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
          />
        </Box>

        {items.length > 0 && (
          <Stack component="ul" spacing={1} sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>
            {items.map((i) => (
              <Box
                component="li"
                key={i.key}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1, borderRadius: 1.5, border: "1px solid var(--color-border)" }}
              >
                <FileTypeIcon filename={i.file.name} mime={i.file.type || null} size={32} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                    {i.file.name}
                  </Typography>
                  {i.status === "uploading" ? (
                    <LinearProgress sx={{ mt: 0.75, height: 3, borderRadius: 999 }} />
                  ) : (
                    <Typography sx={{ fontSize: 12, color: i.status === "error" ? "error.main" : "text.muted" }}>
                      {i.status === "error" ? i.message : formatSize(i.file.size)}
                    </Typography>
                  )}
                </Box>
                {i.status === "done" && <Check aria-label="Uploaded" sx={{ fontSize: 18, color: "success.main" }} />}
                {i.status === "error" && <ErrorOutlined aria-hidden sx={{ fontSize: 18, color: "error.main" }} />}
                {(i.status === "ready" || i.status === "error") && (
                  <IconButton size="small" aria-label={`Remove ${i.file.name}`} onClick={() => setItems((prev) => prev.filter((p) => p.key !== i.key))}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {items.length > 0 && (
          <Button color="secondary" onClick={() => setItems((prev) => prev.filter((i) => i.status === "uploading"))} disabled={busy} sx={{ mr: "auto" }}>
            Remove all
          </Button>
        )}
        <Button color="secondary" variant="outlined" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={uploadAll} loading={busy} disabled={!pending.length}>
          Upload{pending.length > 1 ? ` ${pending.length} files` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
