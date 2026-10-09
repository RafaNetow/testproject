import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Stack from "@mui/material/Stack";

/** Request time; kept out of the component body so render stays pure. */
function currentTime() {
  return Date.now();
}

type MeetingRow = {
  id: string;
  title: string;
  zoom_url: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  project_id: string;
  projects: { name: string; org_id: string; organizations: { name: string } | null } | null;
};

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("meetings")
    .select(
      "id, title, zoom_url, scheduled_at, duration_minutes, status, project_id, projects(name, org_id, organizations(name))"
    )
    .order("scheduled_at", { ascending: true });

  const meetings = (data ?? []) as unknown as MeetingRow[];
  const now = currentTime();
  const upcoming = meetings.filter(
    (m) => m.status !== "cancelled" && new Date(m.scheduled_at).getTime() >= now
  );
  const past = meetings
    .filter((m) => m.status === "cancelled" || new Date(m.scheduled_at).getTime() < now)
    .reverse();

  function renderMeeting(m: MeetingRow) {
    const when = new Date(m.scheduled_at);
    const orgName = m.projects?.organizations?.name ?? "—";
    return (
      <Paper
        key={m.id}
        variant="outlined"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: 2.5 }}
      >
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h3" sx={{ fontSize: 16 }}>
              {m.title}
            </Typography>
            <StatusBadge status={m.status} />
          </Box>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.muted" }}>
            {orgName} · {m.projects?.name ?? "—"}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.muted" }}>
            {when.toLocaleDateString("en-GB", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            {m.duration_minutes ? ` · ${m.duration_minutes} min` : ""}
          </Typography>
        </div>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {m.zoom_url && (
            <Button
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
          <Button href={`/admin/clients/${m.projects?.org_id}/projects/${m.project_id}/meetings`}>
            Manage
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Stack spacing={5}>
      <SectionHeader eyebrow="Calendar" title="Meetings across all clients" />

      <Stack spacing={2}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>Upcoming</Typography>
        {!upcoming.length ? (
          <Typography sx={{ fontSize: 14, color: "text.muted" }}>Nothing scheduled.</Typography>
        ) : (
          <Stack spacing={1.5}>{upcoming.map(renderMeeting)}</Stack>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>Past &amp; cancelled</Typography>
        {!past.length ? (
          <Typography sx={{ fontSize: 14, color: "text.muted" }}>Nothing yet.</Typography>
        ) : (
          <Stack spacing={1.5}>{past.map(renderMeeting)}</Stack>
        )}
      </Stack>
    </Stack>
  );
}
