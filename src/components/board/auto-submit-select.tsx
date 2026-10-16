"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import Box from "@mui/material/Box";
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
  const anchor = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);

  return (
    // display: contents keeps the layout exactly as if the select stood alone.
    <Box ref={anchor} sx={{ display: "contents" }}>
      <SelectField
        key={defaultValue}
        name={name}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => {
          // The form must see the new value before it is submitted.
          flushSync(() => setValue(e.target.value));
          anchor.current?.closest("form")?.requestSubmit();
        }}
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
    </Box>
  );
}
