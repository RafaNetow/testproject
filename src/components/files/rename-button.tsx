"use client";

import { useId, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import EditOutlined from "@mui/icons-material/EditOutlined";

/**
 * Opens a small dialog to rename something, then submits the surrounding
 * server-action <form> with the new name in a hidden field.
 */
export function RenameButton({
  fieldName,
  currentValue,
  promptText,
  ariaLabel,
}: {
  fieldName: string;
  currentValue: string;
  promptText: string;
  ariaLabel: string;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentValue);

  function save() {
    const next = value.trim();
    setOpen(false);
    if (!next || next === currentValue || !hiddenRef.current) return;
    hiddenRef.current.value = next;
    hiddenRef.current.form?.requestSubmit();
  }

  return (
    <>
      <input ref={hiddenRef} type="hidden" name={fieldName} />
      <IconButton
        size="small"
        aria-label={ariaLabel}
        onClick={() => {
          setValue(currentValue);
          setOpen(true);
        }}
        sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
      >
        <EditOutlined sx={{ fontSize: 16 }} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} maxWidth="xs" fullWidth>
        <DialogTitle id={titleId} sx={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {promptText}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={save} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
