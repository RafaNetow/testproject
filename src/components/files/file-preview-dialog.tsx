"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { Close } from "@/components/icons";

/** Previews an image or PDF in a dialog; opened from the File Manager's menus and details drawer. */
export function FilePreviewDialog({
  file,
  onClose,
}: {
  file: { filename: string; url: string | null; mime_type: string | null } | null;
  onClose: () => void;
}) {
  const isImage = file?.mime_type?.startsWith("image/");
  return (
    <Dialog open={Boolean(file?.url)} onClose={onClose} maxWidth="md" fullWidth>
      {file?.url && (
        <>
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
              {file.filename}
            </Box>
            <IconButton size="small" aria-label="Close preview" onClick={onClose}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {isImage ? (
              <Box component="img" src={file.url} alt={file.filename} sx={{ display: "block", mx: "auto", maxWidth: "100%", borderRadius: 2 }} />
            ) : (
              <Box component="iframe" src={file.url} title={file.filename} sx={{ width: "100%", height: "75dvh", border: 1, borderColor: "divider", borderRadius: 2 }} />
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
