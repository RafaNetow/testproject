import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { publishUpdate, deleteUpdate } from "@/lib/actions/updates";
import { DeleteOutlined } from "@/components/icons";

type Update = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

export function UpdatesView({
  projectId,
  updates,
  revalidatePaths,
  canPublish,
  canDelete,
}: {
  projectId: string;
  updates: Update[];
  revalidatePaths: string[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const publishForThisProject = publishUpdate.bind(null, projectId, revalidatePaths);

  return (
    <Stack spacing={3}>
      {canPublish && (
        <Paper component="form" action={publishForThisProject} variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField name="title" label="Title" required placeholder="e.g. Week 6: batch trial results" />
            <TextField
              name="body"
              label="Update"
              required
              multiline
              minRows={3}
              placeholder="What happened, what it means, what's next"
            />
            <Box>
              <Button type="submit" variant="contained">
                Publish update
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {!updates.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No updates published yet.</Typography>
      ) : (
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          {updates.map((u) => {
            const deleteThis = deleteUpdate.bind(null, u.id, revalidatePaths);
            return (
              <Box
                key={u.id}
                component="article"
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
                    {u.title}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6, color: "text.secondary", whiteSpace: "pre-line" }}>
                    {u.body}
                  </Typography>
                  <Typography sx={{ mt: 1, fontFamily: "var(--font-mono)", fontSize: 12, color: "text.muted" }}>
                    {new Date(u.published_at).toLocaleDateString("en-GB", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </div>
                {canDelete && (
                  <form action={deleteThis}>
                    <ConfirmButton
                      confirmText={`Delete the update "${u.title}"?`}
                      ariaLabel={`Delete update "${u.title}"`}
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
