"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { inviteCollaborator } from "@/lib/actions/team";
import type { InviteResult } from "@/lib/invite-email";

export function InviteCollaboratorForm({ orgId }: { orgId: string }) {
  const [state, formAction, isPending] = useActionState<InviteResult | null, FormData>(
    async (_prevState, formData) => inviteCollaborator(orgId, formData),
    null
  );

  return (
    <Stack spacing={2} sx={{ mt: 2.5 }}>
      <Box
        component="form"
        action={formAction}
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}
      >
        <TextField
          name="email"
          type="email"
          label="Email"
          required
          placeholder="colleague@company.com"
          sx={{ flex: 1, minWidth: 220 }}
        />
        <Button type="submit" variant="outlined" color="navy" disabled={isPending} sx={{ height: 40 }}>
          {isPending ? "Sending…" : "Invite collaborator"}
        </Button>
      </Box>

      {state && (
        <Alert
          role="status"
          variant="outlined"
          severity={!state.success ? "error" : state.emailSent ? "success" : "warning"}
        >
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}
