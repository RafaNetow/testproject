"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

/**
 * One name field in a dialog: "New folder" and "Rename" in the File Manager.
 * `onSave` runs the server action; errors it throws show in the dialog.
 */
export function NameDialog({
  open,
  title,
  label,
  initial = "",
  saveLabel,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  initial?: string;
  saveLabel: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="name-dialog-title">
      {/* Re-mounted per opening so the field starts from `initial`. */}
      {open && <Form title={title} label={label} initial={initial} saveLabel={saveLabel} onSave={onSave} onClose={onClose} />}
    </Dialog>
  );
}

function Form({ title, label, initial, saveLabel, onSave, onClose }: { title: string; label: string; initial: string; saveLabel: string; onSave: (name: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <DialogTitle id="name-dialog-title" sx={{ fontWeight: 700 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label={label}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
          slotProps={{ htmlInput: { maxLength: 200, onFocus: (e: FocusEvent<HTMLInputElement>) => e.target.select() } }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="secondary" variant="outlined" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={busy} disabled={!name.trim() || name.trim() === initial}>
          {saveLabel}
        </Button>
      </DialogActions>
    </form>
  );
}
