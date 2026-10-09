"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * A destructive submit button for a server-action form, gated behind a
 * confirmation dialog. On confirm it submits the form it sits in, so the
 * surrounding `<form action={...}>` keeps working unchanged.
 *
 * Pass only `icon` for a compact icon button, or `children` for a labelled one.
 */
export function ConfirmButton({
  confirmText,
  title = "Are you sure?",
  confirmLabel = "Delete",
  ariaLabel,
  icon,
  children,
  variant = "text",
  color = "inherit",
  size = "small",
  sx,
}: {
  confirmText: string;
  title?: string;
  confirmLabel?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  children?: ReactNode;
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  function confirm() {
    setOpen(false);
    buttonRef.current?.form?.requestSubmit();
  }

  return (
    <>
      {children ? (
        <Button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ariaLabel}
          startIcon={icon}
          variant={variant}
          color={color}
          size={size}
          sx={sx}
        >
          {children}
        </Button>
      ) : (
        <IconButton
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ariaLabel}
          size={size}
          sx={[
            { color: "text.muted", "&:hover": { color: "error.main", bgcolor: "color-mix(in srgb, var(--color-destructive) 10%, transparent)" } },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {icon}
        </IconButton>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} maxWidth="xs" fullWidth>
        <DialogTitle id={titleId} sx={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary" }}>{confirmText}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={confirm} variant="contained" color="error" autoFocus>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
