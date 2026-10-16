"use client";

import { useActionState, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { FileInput } from "@/components/shared/file-input";
import {
  sendContractForPortalSigning,
  sendContractForSignature,
  type SendForSignatureResult,
} from "@/lib/actions/contracts";

type Method = "portal" | "email";

/**
 * Two ways to collect a signature on an unsigned PDF:
 *  - in the portal: the workspace owner reviews and signs it there (no external service);
 *  - by email through Documenso (needs DOCUMENSO_API_KEY): for signers outside the portal.
 */
export function SendForSignatureForm({
  contractId,
  orgId,
  revalidatePaths,
}: {
  contractId: string;
  orgId: string;
  revalidatePaths: string[];
}) {
  const [method, setMethod] = useState<Method>("portal");
  const [state, formAction, isPending] = useActionState<SendForSignatureResult | null, FormData>(
    async (prevState, formData) =>
      method === "portal"
        ? sendContractForPortalSigning(contractId, orgId, revalidatePaths, prevState, formData)
        : sendContractForSignature(contractId, orgId, revalidatePaths, prevState, formData),
    null
  );

  return (
    <Paper component="form" action={formAction} variant="outlined" sx={{ mt: 1.5, p: 2, bgcolor: "background.default" }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={method}
        onChange={(_, v: Method | null) => v && setMethod(v)}
        aria-label="How should it be signed?"
        sx={{ mb: 1.5 }}
      >
        <ToggleButton value="portal" sx={{ textTransform: "none", px: 1.5 }}>
          Sign in the portal
        </ToggleButton>
        <ToggleButton value="email" sx={{ textTransform: "none", px: 1.5 }}>
          Send by email (Documenso)
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography sx={{ mb: 1.5, fontSize: 12, color: "text.muted" }}>
        {method === "portal"
          ? "The client's workspace owner reviews the PDF and signs it in their portal. You'll get a copy with a signature certificate."
          : "Sends a signing link by email through Documenso, for a signer who doesn't use the portal."}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}>
        {method === "email" && (
          <>
            <TextField name="recipient_name" label="Signer name" required placeholder="Jane Doe" sx={{ flex: 1, minWidth: 140 }} />
            <TextField
              name="recipient_email"
              label="Signer email"
              type="email"
              required
              placeholder="jane@client.com"
              sx={{ flex: 1, minWidth: 160 }}
            />
          </>
        )}
        <FileInput name="pdf" label="Unsigned PDF" accept="application/pdf" required size="small" />
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? "Sending…" : method === "portal" ? "Send for signature" : "Send by email"}
        </Button>
      </Box>

      {state && (
        <Alert role="status" variant="outlined" severity={state.success ? "success" : "error"} sx={{ mt: 1.5 }}>
          {state.message}
        </Alert>
      )}
    </Paper>
  );
}
