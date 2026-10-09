"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import { reviewDeliverable, type ReviewState } from "@/lib/actions/deliverables";

/**
 * The client owner's response to a deliverable: approve it, or send it back
 * with a note. Errors (a missing note, a deliverable that was already
 * reviewed) are shown inline instead of crashing the page.
 */
export function ReviewControls({ deliverableId, title }: { deliverableId: string; title: string }) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    reviewDeliverable.bind(null, deliverableId),
    null
  );

  return (
    <Stack component="form" action={formAction} spacing={1.5} sx={{ mt: 2.5, borderTop: 1, borderColor: "divider", pt: 2.5 }}>
      <TextField
        name="note"
        label="Your note"
        helperText="Required to request changes"
        multiline
        minRows={3}
        defaultValue={state && !state.ok ? (state.note ?? "") : ""}
        placeholder="What should we change or clarify?"
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />

      {state && !state.ok && (
        <Alert role="alert" severity="error" variant="outlined">
          {state.message}
        </Alert>
      )}
      {state?.ok && (
        <Alert role="status" severity="success" variant="outlined">
          {state.message}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          aria-label={`Approve "${title}"`}
          variant="contained"
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
        >
          Approve
        </Button>
        <Button
          type="submit"
          name="decision"
          value="changes_requested"
          disabled={pending}
          aria-label={`Request changes to "${title}"`}
          variant="outlined"
          color="secondary"
          startIcon={<EditNoteOutlined />}
        >
          Request changes
        </Button>
      </Box>
    </Stack>
  );
}
