"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { saveRules, type LearnResult } from "@/lib/actions/ai-learning";

/** Axel's rules: plain sentences the copilot always follows when drafting a reply. */
export function AssistantRulesForm({ initial }: { initial: string }) {
  const [state, formAction, pending] = useActionState<LearnResult | null, FormData>(saveRules, null);
  return (
    <Box component="form" action={formAction} sx={{ display: "grid", gap: 1.5 }}>
      <TextField
        name="body"
        defaultValue={initial}
        multiline
        minRows={6}
        maxRows={16}
        fullWidth
        placeholder={"One rule per line, for example:\n- Never promise a deadline before seeing the data.\n- Always ask for the supplier lot number.\n- Keep replies under 100 words and end with one clear next step."}
        slotProps={{ htmlInput: { "aria-label": "Axel's rules", maxLength: 6000 } }}
      />
      {state && (
        <Alert severity={state.ok ? "success" : "error"} sx={{ fontSize: 13 }}>
          {state.message}
        </Alert>
      )}
      <Box>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Saving…" : "Save rules"}
        </Button>
      </Box>
    </Box>
  );
}
