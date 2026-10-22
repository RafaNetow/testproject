import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewControls } from "@/components/deliverables/review-controls";
import {
  ADMIN_STATUS_LABEL,
  CLIENT_STATUS_LABEL,
  DELIVERABLE_STATUSES,
  formatDateOnly,
  groupForClient,
  isOverdue,
  type DeliverableStatus,
} from "@/lib/deliverables";
import {
  attachDeliverableFile,
  createDeliverable,
  deleteDeliverable,
  detachDeliverableFile,
  updateDeliverable,
} from "@/lib/actions/deliverables";
import { AttachFile, Close, DeleteOutlined, DescriptionOutlined, ExpandMore } from "@/components/icons";
import { SubmitButton } from "@/components/shared/submit-button";

export type DeliverableFile = {
  id: string;
  filename: string;
  size_bytes: number;
  url: string | null;
};

export type DeliverableRow = {
  id: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  files: DeliverableFile[];
};

export type ProjectFileOption = { id: string; filename: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileList({
  files,
  onDetach,
}: {
  files: DeliverableFile[];
  onDetach?: (fileId: string) => (() => Promise<void>) | undefined;
}) {
  if (!files.length) return null;
  return (
    <Stack component="ul" spacing={0.75} sx={{ mt: 2, p: 0, listStyle: "none" }}>
      {files.map((f) => {
        const detach = onDetach?.(f.id);
        return (
          <Box component="li" key={f.id} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 14 }}>
            <DescriptionOutlined sx={{ fontSize: 17, color: "text.muted", flexShrink: 0 }} />
            {f.url ? (
              <MuiLink
                href={f.url}
                download={f.filename}
                sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}
              >
                {f.filename}
              </MuiLink>
            ) : (
              <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "text.muted" }}>
                {f.filename} (unavailable)
              </Box>
            )}
            <Box component="span" sx={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
              {formatSize(f.size_bytes)}
            </Box>
            {detach && (
              <form action={detach}>
                <IconButton
                  type="submit"
                  size="small"
                  aria-label={`Remove ${f.filename} from this deliverable`}
                  sx={{ width: 24, height: 24, color: "text.muted", "&:hover": { color: "error.main" } }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </form>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function DueDate({ d, today }: { d: DeliverableRow; today?: string }) {
  if (!d.due_date) return null;
  const overdue = isOverdue(d.due_date, d.status, today);
  return (
    <Typography
      component="span"
      sx={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: overdue ? 500 : 400, color: overdue ? "error.main" : "text.muted" }}
    >
      {overdue ? "Overdue · " : "Due "}
      {formatDateOnly(d.due_date)}
    </Typography>
  );
}

function ReviewOutcome({ d, audience }: { d: DeliverableRow; audience: "admin" | "client" }) {
  if (d.status === "approved" && d.reviewed_at) {
    return <Typography sx={{ mt: 2, fontSize: 14, color: "text.secondary" }}>Approved on {formatDateOnly(d.reviewed_at)}.</Typography>;
  }
  if (d.status === "changes_requested" && d.review_note) {
    return (
      <Box sx={{ mt: 2, borderRadius: 2, bgcolor: "var(--color-muted)", px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
          {audience === "client" ? "Changes you requested" : "Changes the client requested"}
        </Typography>
        <Typography sx={{ mt: 0.5, whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.6, color: "text.secondary" }}>
          {d.review_note}
        </Typography>
      </Box>
    );
  }
  return null;
}

function CardHeader({ d, label, today }: { d: DeliverableRow; label: string; today?: string }) {
  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: 0.75 }}>
        <Typography variant="h3" sx={{ fontSize: 16 }}>
          {d.title}
        </Typography>
        <StatusBadge status={d.status} label={label} />
        <DueDate d={d} today={today} />
      </Box>
      {d.description && (
        <Typography sx={{ mt: 1, whiteSpace: "pre-line", fontSize: 14, lineHeight: 1.6, color: "text.muted" }}>{d.description}</Typography>
      )}
    </>
  );
}

const statusOptions = DELIVERABLE_STATUSES.map((s) => (
  <option key={s} value={s}>
    {ADMIN_STATUS_LABEL[s]}
  </option>
));

export function DeliverablesView({
  mode,
  projectId,
  deliverables,
  projectFiles = [],
  canReview = false,
  today,
}: {
  mode: "admin" | "client";
  projectId: string;
  deliverables: DeliverableRow[];
  projectFiles?: ProjectFileOption[];
  canReview?: boolean;
  today?: string;
}) {
  return mode === "admin" ? (
    <AdminDeliverables projectId={projectId} deliverables={deliverables} projectFiles={projectFiles} today={today} />
  ) : (
    <ClientDeliverables deliverables={deliverables} canReview={canReview} today={today} />
  );
}

/* ------------------------------ client ------------------------------ */

function ClientDeliverables({
  deliverables,
  canReview,
  today,
}: {
  deliverables: DeliverableRow[];
  canReview: boolean;
  today?: string;
}) {
  if (!deliverables.length) {
    return (
      <EmptyState title="No deliverables yet">
        Reports and recommendations will appear here as soon as they&apos;re ready for you.
      </EmptyState>
    );
  }

  const groups = groupForClient(deliverables);
  const sections: { key: string; title: string; items: DeliverableRow[] }[] = [
    { key: "review", title: "Awaiting your review", items: groups.awaitingReview },
    { key: "changes", title: "Changes requested", items: groups.changesRequested },
    { key: "progress", title: "In progress", items: groups.inProgress },
    { key: "approved", title: "Approved", items: groups.approved },
  ];

  return (
    <Stack spacing={5} className="stagger">
      {sections
        .filter((s) => s.items.length)
        .map((s) => (
          <Stack component="section" key={s.key} aria-labelledby={`deliverables-${s.key}`} spacing={2}>
            <Typography variant="h2" id={`deliverables-${s.key}`} sx={{ fontSize: 18 }}>
              {s.title}
              <Box component="span" sx={{ ml: 1, fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 400, color: "text.muted" }}>
                {s.items.length}
              </Box>
            </Typography>
            {s.items.map((d) => (
              <Paper component="article" key={d.id} variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
                <CardHeader d={d} label={CLIENT_STATUS_LABEL[d.status]} today={today} />
                <FileList files={d.files} />
                <ReviewOutcome d={d} audience="client" />
                {d.status === "in_review" &&
                  (canReview ? (
                    <ReviewControls deliverableId={d.id} title={d.title} />
                  ) : (
                    <Typography sx={{ mt: 2, fontSize: 14, color: "text.muted" }}>
                      Only your workspace owner can approve this or request changes.
                    </Typography>
                  ))}
              </Paper>
            ))}
          </Stack>
        ))}
    </Stack>
  );
}

/* ------------------------------- admin ------------------------------ */

function AdminDeliverables({
  projectId,
  deliverables,
  projectFiles,
  today,
}: {
  projectId: string;
  deliverables: DeliverableRow[];
  projectFiles: ProjectFileOption[];
  today?: string;
}) {
  const create = createDeliverable.bind(null, projectId);

  return (
    <Stack spacing={4}>
      <Paper component="form" action={create} variant="outlined" sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <TextField
            name="title"
            label="Title"
            required
            placeholder="e.g. Root-cause report: bond failures"
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
          <TextField
            name="description"
            label="Description (optional)"
            multiline
            minRows={2}
            placeholder="What the client is getting and what you need from them"
            slotProps={{ htmlInput: { maxLength: 5000 } }}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <TextField
              name="due_date"
              label="Due date (optional)"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <SelectField name="status" label="Status" defaultValue="draft" sx={{ flex: 1, minWidth: 200 }}>
              {statusOptions}
            </SelectField>
          </Box>
          <Typography sx={{ fontSize: 12, color: "text.muted" }}>
            Drafts are hidden from the client. Setting a deliverable to &ldquo;Awaiting client&rdquo; shows it to them
            and notifies their team.
          </Typography>
          <Box>
            <SubmitButton variant="contained">
              Add deliverable
            </SubmitButton>
          </Box>
        </Stack>
      </Paper>

      {!deliverables.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No deliverables yet.</Typography>
      ) : (
        <Stack spacing={2} className="stagger">
          {deliverables.map((d) => {
            const update = updateDeliverable.bind(null, d.id);
            const attach = attachDeliverableFile.bind(null, d.id);
            const remove = deleteDeliverable.bind(null, d.id);
            const attachedIds = new Set(d.files.map((f) => f.id));
            const attachable = projectFiles.filter((f) => !attachedIds.has(f.id));

            return (
              <Paper component="article" key={d.id} variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
                <CardHeader d={d} label={ADMIN_STATUS_LABEL[d.status]} today={today} />
                <FileList files={d.files} onDetach={(fileId) => detachDeliverableFile.bind(null, d.id, fileId)} />
                <ReviewOutcome d={d} audience="admin" />

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{ mt: 2, bgcolor: "transparent", borderTop: 1, borderColor: "divider", "&::before": { display: "none" } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ fontSize: 18 }} />}
                    sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 1 } }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: "primary.main" }}>
                      Edit &ldquo;{d.title}&rdquo;
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    <Stack spacing={3}>
                      <Stack component="form" action={update} spacing={2}>
                        <TextField name="title" label="Title" required defaultValue={d.title} slotProps={{ htmlInput: { maxLength: 200 } }} />
                        <TextField
                          name="description"
                          label="Description"
                          multiline
                          minRows={3}
                          defaultValue={d.description ?? ""}
                          slotProps={{ htmlInput: { maxLength: 5000 } }}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                          <TextField
                            name="due_date"
                            label="Due date"
                            type="date"
                            defaultValue={d.due_date ?? ""}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1, minWidth: 160 }}
                          />
                          <SelectField name="status" label="Status" defaultValue={d.status} sx={{ flex: 1, minWidth: 200 }}>
                            {statusOptions}
                          </SelectField>
                        </Box>
                        <Box>
                          <SubmitButton variant="contained">
                            Save changes
                          </SubmitButton>
                        </Box>
                      </Stack>

                      <Box component="form" action={attach} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                        <SelectField
                          name="file_id"
                          label="Attach a project file"
                          defaultValue=""
                          disabled={!attachable.length}
                          sx={{ flex: 1, minWidth: 220 }}
                        >
                          <option value="">{attachable.length ? "Choose a file…" : "No more files in this project"}</option>
                          {attachable.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.filename}
                            </option>
                          ))}
                        </SelectField>
                        <SubmitButton variant="outlined" color="secondary" startIcon={<AttachFile />} disabled={!attachable.length}>
                          Attach
                        </SubmitButton>
                      </Box>

                      <form action={remove}>
                        <ConfirmButton
                          confirmText={`Delete the deliverable "${d.title}"? This can't be undone.`}
                          ariaLabel={`Delete deliverable "${d.title}"`}
                          icon={<DeleteOutlined />}
                          color="error"
                        >
                          Delete this deliverable
                        </ConfirmButton>
                      </form>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
