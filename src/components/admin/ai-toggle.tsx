"use client";

import { useState, useTransition } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { setOrgAi } from "@/lib/actions/ai";

/** Admin: per-client opt-in for the Alchemica Assistant. Off by default. */
export function AiToggle({ orgId, enabled, configured }: { orgId: string; enabled: boolean; configured: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={on}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.checked;
              setOn(next);
              startTransition(() => setOrgAi(orgId, next));
            }}
          />
        }
        label="AI assistant for this client"
        slotProps={{ typography: { sx: { fontSize: 14, fontWeight: 600 } } }}
      />
      <Typography sx={{ fontSize: 12, color: "text.muted" }}>
        Lets this client&apos;s team ask questions about their own project. Answers use only their project data and are logged.
        {" "}Turn it on only after the client has agreed: the current provider may process data outside the EU.
      </Typography>
      {!configured && (
        <Typography sx={{ fontSize: 12, color: "warning.main" }}>
          AI isn&apos;t configured yet — add the AI_* keys to .env.local. The client won&apos;t see the assistant until then.
        </Typography>
      )}
    </Stack>
  );
}
