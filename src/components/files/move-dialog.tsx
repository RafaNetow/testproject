"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Check } from "@/components/icons";
import { FolderYellow } from "./file-icons";

const ROOT = "__root__";

/** Admin: pick the folder to move one or more files into. */
export function MoveDialog({
  open,
  count,
  currentFolderId,
  folders,
  onMove,
  onClose,
}: {
  open: boolean;
  count: number;
  currentFolderId: string | null;
  folders: { id: string; name: string; path: string }[];
  onMove: (folderId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="move-title">
      {open && <Body count={count} currentFolderId={currentFolderId} folders={folders} onMove={onMove} onClose={onClose} />}
    </Dialog>
  );
}

function Body({ count, currentFolderId, folders, onMove, onClose }: { count: number; currentFolderId: string | null; folders: { id: string; name: string; path: string }[]; onMove: (folderId: string | null) => Promise<void>; onClose: () => void }) {
  const here = currentFolderId ?? ROOT;
  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = [{ id: ROOT, name: "All files", path: "Top level" }, ...folders];

  async function move() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await onMove(target === ROOT ? null : target);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't move them.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogTitle id="move-title" sx={{ fontWeight: 700 }}>
        Move {count === 1 ? "file" : `${count} files`} to…
      </DialogTitle>
      <DialogContent sx={{ px: 1.5 }}>
        <List dense role="listbox" aria-label="Folders" sx={{ maxHeight: 360, overflowY: "auto" }}>
          {options.map((o) => {
            const current = o.id === here;
            return (
              <ListItemButton key={o.id} role="option" aria-selected={target === o.id} selected={target === o.id} disabled={current} onClick={() => setTarget(o.id)} sx={{ borderRadius: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FolderYellow size={26} />
                </ListItemIcon>
                <ListItemText
                  primary={o.name}
                  secondary={current ? "Here now" : o.path}
                  slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } }, secondary: { noWrap: true, sx: { fontSize: 12 } } }}
                />
                {target === o.id && <Check sx={{ fontSize: 18, color: "primary.main" }} />}
              </ListItemButton>
            );
          })}
        </List>
        {error && (
          <Alert severity="error" sx={{ mx: 1.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="secondary" variant="outlined" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={move} loading={busy} disabled={!target}>
          Move
        </Button>
      </DialogActions>
    </>
  );
}
