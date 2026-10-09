import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import { ConfirmButton } from "@/components/confirm-button";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { createMeeting, updateMeeting, deleteMeeting } from "@/lib/actions/meetings";

type Meeting = {
  id: string;
  title: string;
  zoom_url: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
};

export function MeetingsView({
  projectId,
  meetings,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  meetings: Meeting[];
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const createForThisProject = createMeeting.bind(null, projectId, revalidatePaths);

  return (
    <Stack spacing={3}>
      {canManage && (
        <Paper
          component="form"
          action={createForThisProject}
          variant="outlined"
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, p: 2.5 }}
        >
          <TextField name="title" label="Title" required placeholder="Monthly review" sx={{ flex: 1, minWidth: 200 }} />
          <TextField
            name="scheduled_at"
            label="Date & time"
            type="datetime-local"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth={false}
            sx={{ width: 220 }}
          />
          <TextField
            name="duration_minutes"
            label="Minutes"
            type="number"
            placeholder="30"
            slotProps={{ htmlInput: { min: 0 } }}
            fullWidth={false}
            sx={{ width: 110 }}
          />
          <TextField
            name="zoom_url"
            label="Video link (optional)"
            type="url"
            placeholder="https://…"
            sx={{ flex: 1, minWidth: 200 }}
          />
          <Button type="submit" variant="contained" startIcon={<Add />}>
            Schedule
          </Button>
        </Paper>
      )}

      {!meetings.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No meetings scheduled yet.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {meetings.map((m) => {
            const updateThis = updateMeeting.bind(null, m.id, revalidatePaths);
            const deleteThis = deleteMeeting.bind(null, m.id, revalidatePaths);
            const when = new Date(m.scheduled_at);
            return (
              <Paper key={m.id} variant="outlined" sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                  <div>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h3" sx={{ fontSize: 16 }}>
                        {m.title}
                      </Typography>
                      <StatusBadge status={m.status} />
                    </Box>
                    <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.muted" }}>
                      {when.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                      {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {m.duration_minutes ? ` · ${m.duration_minutes} min` : ""}
                    </Typography>
                    {m.notes && (
                      <Typography sx={{ mt: 1, maxWidth: 576, fontSize: 14, lineHeight: 1.6, color: "text.secondary" }}>
                        {m.notes}
                      </Typography>
                    )}
                  </div>
                  {m.zoom_url && (
                    <Button
                      component="a"
                      href={m.zoom_url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      color="secondary"
                      startIcon={<VideocamOutlined />}
                    >
                      Join
                    </Button>
                  )}
                </Box>

                {canManage && (
                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{ mt: 1.5, bgcolor: "transparent", borderTop: 1, borderColor: "divider", "&::before": { display: "none" } }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ fontSize: 18 }} />}
                      sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 1 } }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.muted" }}>Manage</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                      <Box
                        component="form"
                        action={updateThis}
                        sx={{ display: "flex", flex: 1, flexWrap: "wrap", alignItems: "center", gap: 1.5 }}
                      >
                        <SelectField name="status" label="Status" defaultValue={m.status} sx={{ width: 160 }}>
                          <option value="upcoming">Upcoming</option>
                          <option value="past">Past</option>
                          <option value="cancelled">Cancelled</option>
                        </SelectField>
                        <TextField
                          name="notes"
                          label="Notes"
                          defaultValue={m.notes ?? ""}
                          placeholder="What was covered / decided"
                          sx={{ flex: 1, minWidth: 220 }}
                        />
                        <Button type="submit" variant="outlined" color="navy">
                          Save
                        </Button>
                      </Box>
                      <form action={deleteThis}>
                        <ConfirmButton
                          confirmText={`Delete the meeting "${m.title}"?`}
                          ariaLabel={`Delete meeting "${m.title}"`}
                          icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                        />
                      </form>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
