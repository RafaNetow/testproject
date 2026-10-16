"use client";

import { useState, useTransition } from "react";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Check, FolderOutlined, MoreVert } from "@/components/icons";
import { moveFile } from "@/lib/actions/files";

/** Admin: the less frequent file actions (moving between folders) live behind ⋯. */
export function FileRowMenu({
  fileId,
  filename,
  folderId,
  folders,
  revalidatePaths,
}: {
  fileId: string;
  filename: string;
  folderId: string | null;
  folders: { id: string; name: string }[];
  revalidatePaths: string[];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const current = folderId ?? "__root__";
  const targets = [{ id: "__root__", name: "All files (no folder)" }, ...folders];

  function move(id: string) {
    setAnchor(null);
    const form = new FormData();
    form.set("folder_id", id);
    startTransition(() => moveFile(fileId, revalidatePaths, form));
  }

  return (
    <>
      <Tooltip title="More actions">
        <IconButton
          size="small"
          aria-label={`More actions for "${filename}"`}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          disabled={pending}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
        >
          <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 380 } }, list: { dense: true } }}
      >
        <ListSubheader sx={{ lineHeight: "32px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.muted" }}>
          Move to folder
        </ListSubheader>
        {targets.map((t) => {
          const here = t.id === current;
          return (
            <MenuItem key={t.id} disabled={here} onClick={() => move(t.id)} sx={{ fontSize: 14 }}>
              <ListItemIcon sx={{ minWidth: 30 }}>{here ? <Check sx={{ fontSize: 16 }} /> : <FolderOutlined sx={{ fontSize: 16 }} />}</ListItemIcon>
              {t.name}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
