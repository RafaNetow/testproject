"use client";

import { useActionState, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Close } from "@/components/icons";
import { signContract, type SignContractResult } from "@/lib/actions/contracts";

/**
 * The workspace owner reads the contract and signs it: type your full name and
 * confirm. The server files a copy with a signature certificate page.
 */
export function SignContractDialog({
  contractId,
  title,
  pdfUrl,
  revalidatePaths,
}: {
  contractId: string;
  title: string;
  pdfUrl: string | null;
  revalidatePaths: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SignContractResult | null, FormData>(
    (prev, formData) => signContract(contractId, revalidatePaths, prev, formData),
    null
  );
  // Once the signature is recorded the dialog closes; the page refreshes with the signed copy.
  const visible = open && !state?.success;

  return (
    <>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        Review &amp; sign
      </Button>
      <Dialog open={visible} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="md" aria-labelledby={`sign-${contractId}`}>
        <DialogTitle id={`sign-${contractId}`} sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <Box component="span" sx={{ flex: 1, fontSize: 18, fontWeight: 700 }}>
            {title}
          </Box>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} disabled={pending}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {pdfUrl ? (
            <Box
              component="iframe"
              title={`${title} (PDF)`}
              src={pdfUrl}
              sx={{ width: "100%", height: { xs: 320, md: 440 }, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default" }}
            />
          ) : (
            <Alert severity="warning">We couldn&apos;t load the PDF preview. Please reload the page.</Alert>
          )}
          {pdfUrl && (
            <Typography sx={{ mt: 0.75, fontSize: 12 }}>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Open the PDF in a new tab
              </a>
            </Typography>
          )}

          <Box component="form" action={formAction} sx={{ mt: 2.5, display: "grid", gap: 1.5 }}>
            <TextField
              name="full_name"
              label="Type your full name to sign"
              required
              autoComplete="name"
              slotProps={{ htmlInput: { minLength: 3, maxLength: 120 } }}
            />
            <FormControlLabel
              control={<Checkbox name="agree" required />}
              label="I have read this contract and agree to be bound by it. I understand that typing my name and selecting “Sign” is my electronic signature."
              slotProps={{ typography: { sx: { fontSize: 13, lineHeight: 1.5 } } }}
              sx={{ alignItems: "flex-start", m: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
            />
            {state && !state.success && state.message && <Alert severity="error">{state.message}</Alert>}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={() => setOpen(false)} disabled={pending} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={pending}>
                {pending ? "Signing…" : "Sign"}
              </Button>
            </Box>
            <Typography sx={{ fontSize: 12, color: "text.muted" }}>
              We record your name, account, the time and your IP address, and attach a certificate page to the PDF.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
