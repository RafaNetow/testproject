"use client";

import type { ChangeEvent, ReactNode } from "react";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * MUI select rendered as a *native* <select>, so it keeps working inside plain
 * server-action forms (name/defaultValue are submitted with the form) and on
 * mobile it opens the platform picker. Options are passed as <option> children.
 */
export function SelectField({
  label,
  children,
  sx,
  onChange,
  ...props
}: {
  label?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}) {
  const { "aria-label": ariaLabel, ...rest } = props;
  return (
    <TextField
      select
      label={label}
      sx={sx}
      onChange={onChange as ((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined}
      slotProps={{ select: { native: true }, htmlInput: ariaLabel ? { "aria-label": ariaLabel } : undefined }}
      {...rest}
    >
      {children}
    </TextField>
  );
}
