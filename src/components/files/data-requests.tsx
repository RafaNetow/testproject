"use client";

import { useActionState, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { ConfirmButton } from "@/components/confirm-button";
import { FileInput } from "@/components/shared/file-input";
import { SelectField } from "@/components/shared/select-field";
import { STATUS_TONE, figureSx } from "@/lib/palette";
import { FILE_LABELS } from "@/lib/techniques";
import { TechniqueLabel } from "@/components/shared/technique-label";
import {
  createDataRequest,
  deleteDataRequest,
  fulfillDataRequest,
  setDataRequestReceived,
  type FulfillResult,
} from "@/lib/actions/data-requests";

export type DataRequestRow = {
  id: string;
  title: string;
  details: string | null;
  technique: string | null;
  folder_id: string | null;
  due_date: string | null;
  status: "requested" | "received";
  file_id: string | null;
};

type FileRef = { filename: string; url: string | null };

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The checklist of data Alchemica needs from the client. Clients upload into
 * each item's slot; the admin adds, withdraws, and marks items received.
 */
export function DataRequests({
  projectId,
  requests,
  files,
  folders,
  canManage,
  revalidatePaths,
}: {
  projectId: string;
  requests: DataRequestRow[];
  files: Record<string, FileRef>;
  folders: { id: string; name: string }[];
  canManage: boolean;
  revalidatePaths: string[];
}) {
  const [adding, setAdding] = useState(false);
  if (!canManage && requests.length === 0) return null;

  const received = requests.filter((r) => r.status === "received").length;
  const pct = requests.length ? Math.round((received / requests.length) * 100) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h2" sx={{ fontSize: 18 }}>
          {canManage ? "Requested data" : "Data we need from you"}
        </Typography>
        {requests.length > 0 && (
          <Typography sx={{ ...figureSx, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
            {received} of {requests.length} received
          </Typography>
        )}
      </Box>
      {requests.length > 0 && (
        <LinearProgress
          variant="determinate"
          value={pct}
          aria-label={`${received} of ${requests.length} data requests received`}
          sx={{
            mt: 1.5,
            height: 6,
            borderRadius: 999,
            bgcolor: "rgb(145 158 171 / 0.16)",
            "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: pct === 100 ? STATUS_TONE.success.solid : "primary.main" },
          }}
        />
      )}
      {!canManage && (
        <Typography sx={{ mt: 1.5, fontSize: 14, color: "text.secondary" }}>
          Upload each item into its slot — we&apos;ll be notified as soon as it arrives.
        </Typography>
      )}

      {requests.length > 0 && (
        <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, mt: 2, p: 0 }}>
          {requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              file={r.file_id ? files[r.file_id] : undefined}
              canManage={canManage}
              revalidatePaths={revalidatePaths}
            />
          ))}
        </Stack>
      )}

      {canManage &&
        (adding ? (
          <Stack
            component="form"
            action={async (formData: FormData) => {
              await createDataRequest(projectId, revalidatePaths, formData);
              setAdding(false);
            }}
            spacing={1.5}
            sx={{ mt: 2.5, p: 2, borderRadius: 1.5, border: "1px dashed var(--border-dashed)" }}
          >
            <TextField name="title" label="What do you need?" required autoFocus placeholder="FTIR spectra for batches 7–12" slotProps={{ htmlInput: { maxLength: 160 } }} />
            <TextField name="details" label="Details (optional)" multiline minRows={2} placeholder="Raw exports (.csv) are best; include the batch number in each filename." />
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
              <SelectField name="technique" label="Technique" defaultValue="">
                <option value="">Any</option>
                {FILE_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </SelectField>
              <SelectField name="folder_id" label="Save into folder" defaultValue="">
                <option value="">Top level</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </SelectField>
              <TextField name="due_date" label="Needed by" type="date" slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button type="submit" variant="contained">
                Send request
              </Button>
              <Button color="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </Box>
          </Stack>
        ) : (
          <Button startIcon={<Add />} variant="outlined" color="secondary" onClick={() => setAdding(true)} sx={{ mt: 2.5 }}>
            Request data
          </Button>
        ))}
    </Paper>
  );
}

function RequestRow({
  request,
  file,
  canManage,
  revalidatePaths,
}: {
  request: DataRequestRow;
  file: FileRef | undefined;
  canManage: boolean;
  revalidatePaths: string[];
}) {
  const done = request.status === "received";
  const tone = done ? STATUS_TONE.success : STATUS_TONE.warning;
  const Icon = done ? CheckCircleOutlined : ScheduleOutlined;
  const [state, formAction, pending] = useActionState<FulfillResult | null, FormData>(
    fulfillDataRequest.bind(null, request.id, revalidatePaths),
    null
  );

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        // Wraps on the card's own width (the folder tree narrows it), not the viewport's.
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 1.5,
        border: "1px dashed var(--border-dashed)",
        bgcolor: done ? "transparent" : "color-mix(in srgb, var(--color-warning) 4%, transparent)",
      }}
    >
      <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, borderRadius: "50%", bgcolor: tone.bg, color: tone.text }}>
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: "1 1 220px" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{request.title}</Typography>
        <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, fontSize: 12, color: "text.secondary" }}>
          {request.technique && <TechniqueLabel label={request.technique} size="sm" />}
          <span>{done ? "Received" : request.due_date ? `Needed by ${shortDate(request.due_date)}` : "Waiting for upload"}</span>
          {done && file && (
            <MuiLink href={file.url ?? undefined} target="_blank" rel="noreferrer" sx={{ fontWeight: 600 }}>
              {file.filename}
            </MuiLink>
          )}
        </Box>
        {request.details && <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary" }}>{request.details}</Typography>}
        {state && !state.ok && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {state.message}
          </Alert>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", ml: "auto" }}>
        {!done && (
          <Box component="form" action={formAction} sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <FileInput key={state?.message ?? "initial"} name="file" label="Upload" required size="small" />
            <Button type="submit" variant="contained" size="small" disabled={pending} sx={{ minHeight: 32 }}>
              {pending ? "Uploading…" : "Send"}
            </Button>
          </Box>
        )}
        {canManage && (
          <>
            <Button
              size="small"
              color="secondary"
              onClick={() => setDataRequestReceived(request.id, !done, revalidatePaths)}
            >
              {done ? "Reopen" : "Mark received"}
            </Button>
            <form action={deleteDataRequest.bind(null, request.id, revalidatePaths)}>
              <ConfirmButton
                confirmText={`Withdraw the request "${request.title}"? The client will no longer see it.`}
                ariaLabel={`Withdraw request ${request.title}`}
                confirmLabel="Withdraw"
                icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
              />
            </form>
          </>
        )}
      </Box>
    </Box>
  );
}
