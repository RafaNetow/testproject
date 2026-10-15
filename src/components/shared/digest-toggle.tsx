"use client";

import { useState, useTransition } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { setWeeklyDigest } from "@/lib/actions/digest-preference";

/** Opt in or out of the Monday summary email; saves immediately. */
export function DigestToggle({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          disabled={pending}
          onChange={(_, next) => {
            setChecked(next);
            startTransition(async () => {
              try {
                await setWeeklyDigest(next);
              } catch {
                setChecked(!next);
              }
            });
          }}
        />
      }
      label="Email me a weekly summary every Monday"
      slotProps={{ typography: { sx: { fontSize: 14, fontWeight: 600 } } }}
    />
  );
}
