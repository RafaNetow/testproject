import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { logDecision, deleteDecision } from "@/lib/actions/decisions";
import { DeleteOutlined } from "@/components/icons";
import { SubmitButton } from "@/components/shared/submit-button";

type Decision = {
  id: string;
  title: string;
  body: string | null;
  decided_at: string;
  decision_participants: { participant_name: string }[] | null;
};

export function DecisionsView({
  projectId,
  decisions,
  revalidatePaths,
  canLog,
  canDelete,
}: {
  projectId: string;
  decisions: Decision[];
  revalidatePaths: string[];
  canLog: boolean;
  canDelete: boolean;
}) {
  const logForThisProject = logDecision.bind(null, projectId, revalidatePaths);

  return (
    <Stack spacing={3}>
      {canLog && (
        <Paper component="form" action={logForThisProject} variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField name="title" label="Decision" required placeholder="e.g. Crosslinker swap approved" />
            <TextField
              name="body"
              label="Details (optional)"
              multiline
              minRows={2}
              placeholder="Any context worth keeping with the record"
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <TextField
                name="decided_at"
                label="Date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <TextField
                name="participants"
                label="Participants (optional)"
                placeholder="Comma-separated names"
                sx={{ flex: 2, minWidth: 220 }}
              />
            </Box>
            <Box>
              <SubmitButton variant="contained">
                Log decision
              </SubmitButton>
            </Box>
          </Stack>
        </Paper>
      )}

      {!decisions.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No decisions logged yet.</Typography>
      ) : (
        <Box className="stagger" sx={{ borderTop: 1, borderColor: "divider" }}>
          {decisions.map((d) => {
            const deleteThis = deleteDecision.bind(null, d.id, revalidatePaths);
            return (
              <Box
                key={d.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 2.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <div>
                  <Typography variant="h3" sx={{ fontSize: 16 }}>
                    {d.title}
                  </Typography>
                  {d.body && (
                    <Typography sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6, color: "text.muted" }}>{d.body}</Typography>
                  )}
                  <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                    <Typography component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                      {new Date(d.decided_at).toLocaleDateString("en-GB")}
                    </Typography>
                    {d.decision_participants?.map((p) => (
                      <Chip key={p.participant_name} label={p.participant_name} size="small" sx={{ height: 22, fontSize: 12 }} />
                    ))}
                  </Box>
                </div>
                {canDelete && (
                  <form action={deleteThis}>
                    <ConfirmButton
                      confirmText={`Delete the decision "${d.title}"? This can't be undone.`}
                      ariaLabel={`Delete decision "${d.title}"`}
                      icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                    />
                  </form>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
