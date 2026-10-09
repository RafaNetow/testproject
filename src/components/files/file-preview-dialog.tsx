"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import Close from "@mui/icons-material/Close";

export function FilePreviewDialog({
  filename,
  url,
  mimeType,
}: {
  filename: string;
  url: string;
  mimeType: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) return null;

  return (
    <>
      <IconButton
        size="small"
        title="Preview"
        aria-label={`Preview "${filename}"`}
        onClick={() => setOpen(true)}
        sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
      >
        <VisibilityOutlined sx={{ fontSize: 18 }} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderBottom: 1,
            borderColor: "divider",
            py: 1.5,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {filename}
          </Box>
          <IconButton size="small" aria-label="Close preview" onClick={() => setOpen(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {isImage ? (
            <Box component="img" src={url} alt={filename} sx={{ display: "block", mx: "auto", maxWidth: "100%", borderRadius: 2 }} />
          ) : (
            <Box
              component="iframe"
              src={url}
              title={filename}
              sx={{ width: "100%", height: "75dvh", border: 1, borderColor: "divider", borderRadius: 2 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
