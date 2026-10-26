"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Close, ContentCopy, DeleteOutlined, Download, StarFilled, StarOutline, VisibilityOutlined } from "@/components/icons";
import { TechniqueLabel } from "@/components/shared/technique-label";
import { fileType, formatSize } from "@/lib/file-manager";
import { FileTypeIcon } from "./file-icons";
import { TechniqueMenu } from "./technique-menu";
import type { ManagerFile } from "./file-manager";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });

/**
 * The file's details, as in Minimal's File Manager: a large preview (images)
 * or type icon, the name with a star, the technique as its tag, the
 * properties, and the actions.
 */
export function FileDetailsDrawer({
  file,
  canManage,
  folderName,
  revalidatePaths,
  onClose,
  onToggleStar,
  onPreview,
  onCopyLink,
  onDelete,
}: {
  file: ManagerFile | null;
  canManage: boolean;
  folderName: string;
  revalidatePaths: string[];
  onClose: () => void;
  onToggleStar: (f: ManagerFile) => void;
  onPreview: (f: ManagerFile) => void;
  onCopyLink: (f: ManagerFile) => void;
  onDelete: (f: ManagerFile) => void;
}) {
  return (
    <Drawer anchor="right" open={Boolean(file)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 360 } }, role: "dialog", "aria-label": "File details" } }}>
      {file && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", px: 2.5, py: 2 }}>
            <Typography sx={{ flex: 1, fontSize: 17, fontWeight: 700 }}>Info</Typography>
            <IconButton aria-label="Close details" onClick={onClose}>
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5 }}>
            <Box sx={{ display: "grid", placeItems: "center", height: 180, borderRadius: 2, bgcolor: "var(--fill-track)", overflow: "hidden" }}>
              {file.url && file.mime_type?.startsWith("image/") ? (
                <Box component="img" src={file.url} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <FileTypeIcon filename={file.filename} mime={file.mime_type} size={88} />
              )}
            </Box>
            <Box sx={{ mt: 2, display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700, wordBreak: "break-word" }}>{file.filename}</Typography>
              <Tooltip title={file.favourite ? "Remove from favourites" : "Add to favourites"}>
                <IconButton aria-label={file.favourite ? "Remove from favourites" : "Add to favourites"} aria-pressed={file.favourite} onClick={() => onToggleStar(file)} sx={{ mt: -0.5, color: file.favourite ? "#FFAB00" : "text.muted" }}>
                  {file.favourite ? <StarFilled sx={{ fontSize: 20 }} /> : <StarOutline sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>
            </Box>

            <Typography sx={{ mt: 3, mb: 1, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>Technique</Typography>
            {canManage ? (
              <TechniqueMenu fileId={file.id} filename={file.filename} technique={file.technique} revalidatePaths={revalidatePaths} />
            ) : (
              <TechniqueLabel label={file.technique} />
            )}

            <Typography sx={{ mt: 3, mb: 1, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>Properties</Typography>
            <Stack component="dl" spacing={1.25} sx={{ m: 0, fontSize: 14 }}>
              <Row label="Size" value={formatSize(file.size_bytes)} />
              <Row label="Type" value={fileType(file.filename, file.mime_type).label} />
              <Row label="Folder" value={folderName} />
              <Row label="Added" value={when(file.created_at)} />
              <Row label="Uploaded by" value={file.uploaderName ?? "—"} />
              {file.version_tag && <Row label="Version" value={file.version_tag} />}
            </Stack>
          </Box>
          <Divider />
          <Stack spacing={1} sx={{ p: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Button variant="outlined" color="secondary" startIcon={<VisibilityOutlined />} onClick={() => onPreview(file)} disabled={!canPreview(file)}>
                Preview
              </Button>
              <Button variant="contained" startIcon={<Download />} component="a" href={file.url ?? undefined} download={file.filename} disabled={!file.url}>
                Download
              </Button>
            </Box>
            <Button color="secondary" startIcon={<ContentCopy />} onClick={() => onCopyLink(file)}>
              Copy link
            </Button>
            {canManage && (
              <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={() => onDelete(file)}>
                Delete
              </Button>
            )}
          </Stack>
        </>
      )}
    </Drawer>
  );
}

export function canPreview(f: { url: string | null; mime_type: string | null }) {
  return Boolean(f.url && (f.mime_type?.startsWith("image/") || f.mime_type === "application/pdf"));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Box component="dt" sx={{ width: 96, flexShrink: 0, color: "text.secondary" }}>
        {label}
      </Box>
      <Box component="dd" sx={{ m: 0, fontWeight: 500, minWidth: 0, wordBreak: "break-word" }}>
        {value}
      </Box>
    </Box>
  );
}
