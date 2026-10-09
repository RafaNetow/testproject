"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import { SelectField } from "@/components/shared/select-field";

/** A select whose parent form submits itself on change — no separate button needed. */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  ariaLabel,
  sx,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <SelectField
      name={name}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      sx={[
        { minWidth: 200, "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </SelectField>
  );
}
