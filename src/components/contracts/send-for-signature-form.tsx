"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { FileInput } from "@/components/shared/file-input";
import { sendContractForSignature, type SendForSignatureResult } from "@/lib/actions/contracts";

export function SendForSignatureForm({
  contractId,
  orgId,
  revalidatePaths,
}: {
  contractId: string;
  orgId: string;
  revalidatePaths: string[];
}) {
  const [state, formAction, isPending] = useActionState<SendForSignatureResult | null, FormData>(
    async (_prevState, formData) => sendContractForSignature(contractId, orgId, revalidatePaths, _prevState, formData),
    null
  );

  return (
    <Paper component="form" action={formAction} variant="outlined" sx={{ mt: 1.5, p: 2, bgcolor: "background.default" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}>
        <TextField name="recipient_name" label="Signer name" required placeholder="Jane Doe" sx={{ flex: 1, minWidth: 140 }} />
        <TextField
          name="recipient_email"
          label="Signer email"
          type="email"
          required
          placeholder="jane@client.com"
          sx={{ flex: 1, minWidth: 160 }}
        />
        <FileInput name="pdf" label="Unsigned PDF" accept="application/pdf" required size="small" />
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? "Sending…" : "Send for e-signature"}
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
