"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { SelectField } from "@/components/shared/select-field";
import { inviteMember } from "./actions";
import type { InviteResult } from "@/lib/invite-email";

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, formAction, isPending] = useActionState<InviteResult | null, FormData>(
    async (_prevState, formData) => inviteMember(orgId, formData),
    null
  );

  return (
    <Stack component="form" action={formAction} spacing={2}>
      <TextField name="email" type="email" label="Email" required placeholder="client@company.com" />
      <SelectField name="role" label="Role" defaultValue="owner">
        <option value="owner">Owner</option>
        <option value="collaborator">Collaborator</option>
      </SelectField>
      <Button type="submit" variant="contained" disabled={isPending}>
        {isPending ? "Sending…" : "Send invite"}
      </Button>

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
