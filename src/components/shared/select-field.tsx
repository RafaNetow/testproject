"use client";

import { Children, Fragment, isValidElement, useState, type ReactNode } from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { Check } from "@/components/icons";

type Option = { value: string; label: ReactNode; disabled?: boolean };

/** Reads <option> children (what call sites already pass), looking through fragments and arrays. */
function readOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    if (child.type === Fragment) {
      out.push(...readOptions(props.children));
      return;
    }
    const text = typeof props.children === "string" || typeof props.children === "number" ? String(props.children) : "";
    out.push({ value: String(props.value ?? text), label: props.children, disabled: props.disabled });
  });
  return out;
}

/** What onChange receives: just the new value (and the field name), no DOM event. */
export type SelectChange = { target: { value: string; name?: string } };

/**
 * The app's dropdown: Material UI's own menu (rounded, with the current choice
 * ticked) instead of the browser's plain native list. It still submits inside
 * ordinary server-action forms, because MUI keeps a hidden input carrying the
 * field's name and value. Options are passed as <option> children, as before.
 */
export function SelectField({
  label,
  children,
  sx,
  onChange,
  name,
  defaultValue,
  value,
  disabled,
  required,
  id,
  "aria-label": ariaLabel,
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
  onChange?: (e: SelectChange) => void;
}) {
  const options = readOptions(children);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = controlled ? value : inner;
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <TextField
      select
      id={id}
      name={name}
      label={label}
      value={current}
      disabled={disabled}
      required={required}
      sx={sx}
      onChange={(e) => {
        const next = String(e.target.value);
        if (!controlled) setInner(next);
        onChange?.({ target: { value: next, name } });
      }}
      slotProps={{
        // An empty option ("Top level", "Any") is a real choice, so the label always sits above it.
        inputLabel: label ? { shrink: true } : undefined,
        select: {
          displayEmpty: true,
          renderValue: (v) => labelOf(String(v)),
          SelectDisplayProps: ariaLabel ? ({ "aria-label": ariaLabel } as never) : undefined,
          MenuProps: {
            anchorOrigin: { vertical: "bottom", horizontal: "left" },
            transformOrigin: { vertical: "top", horizontal: "left" },
            slotProps: { paper: { sx: { mt: 0.5, maxHeight: 320, minWidth: 160 } } },
          },
        },
      }}
    >
      {options.map((o) => (
        <MenuItem
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          sx={{
            gap: 1.5,
            minHeight: 38,
            whiteSpace: "normal",
            "& .select-check": { display: "none", flexShrink: 0, fontSize: 16, color: "primary.main", ml: "auto" },
            "&.Mui-selected": { fontWeight: 600 },
            "&.Mui-selected .select-check": { display: "block" },
          }}
        >
          <span>{o.label}</span>
          <Check className="select-check" aria-hidden />
        </MenuItem>
      ))}
    </TextField>
  );
}
