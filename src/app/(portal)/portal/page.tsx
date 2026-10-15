import Stack from "@mui/material/Stack";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { DashboardHero } from "@/components/shared/dashboard-hero";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTiles } from "@/components/shared/stat-tiles";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProjectProgress } from "@/components/shared/project-progress";
import type { TimelineMarker } from "@/components/shared/project-timeline";
import { WaitingOnYou } from "@/components/shared/waiting-on-you";
import { loadWaiting } from "@/lib/waiting";

/** Request time; kept out of the component body so render stays pure. */
function currentTime() {
  return Date.now();
}

export default async function PortalHome() {
  const { org, projects } = await getPortalProjectContext();

  if (!org) {
    return (
      <Stack spacing={5}>
        <SectionHeader eyebrow="Executive Summary" title="Welcome" />
        <EmptyState title="Your workspace is being set up">
          Once you&apos;re added to a project, everything will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const projectIds = projects.map((p) => p.id);

  if (!projectIds.length) {
    return (
      <Stack spacing={5}>
        <SectionHeader eyebrow="Executive Summary" title={org.name} />
        <EmptyState title="Your first project is being set up">
          Once it&apos;s ready, your board, files, and decisions will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();

  const [
    { count: cardCount },
    { count: decisionCount },
    { count: fileCount },
    { data: nextMeeting },
    { data: progressRows },
    { data: deliverableRows },
    { data: upcomingMeetings },
  ] = await Promise.all([
    supabase
      .from("board_cards")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds),
    supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds),
    supabase
      .from("files")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds),
    supabase
      .from("meetings")
      .select("title, scheduled_at")
      .in("project_id", projectIds)
      .eq("status", "upcoming")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, name, status, progress_pct, start_date, project_phases(id, name, position, progress_pct, start_date, end_date)")
      .in("id", projectIds)
      .order("created_at", { ascending: false }),
    // RLS already hides drafts from the client.
    supabase
      .from("deliverables")
      .select("title, status, due_date, project_id")
      .in("project_id", projectIds)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("meetings")
      .select("title, scheduled_at, project_id")
      .in("project_id", projectIds)
      .eq("status", "upcoming")
      .gte("scheduled_at", new Date().toISOString()),
  ]);

  const today = new Date(currentTime()).toISOString().slice(0, 10);
  // Upcoming meetings and open deliverables, drawn on each project's timeline.
  const markersFor = (projectId: string): TimelineMarker[] => [
    ...(upcomingMeetings ?? [])
      .filter((m) => m.project_id === projectId)
      .map((m) => ({ date: m.scheduled_at.slice(0, 10), label: m.title, kind: "meeting" as const })),
    ...(deliverableRows ?? [])
      .filter((d) => d.project_id === projectId && d.due_date && d.status !== "approved")
      .map((d) => ({ date: d.due_date!, label: d.title, kind: "deliverable" as const })),
  ];

  // Active engagements first; each with its stages in the admin's order.
  const progress = (progressRows ?? [])
    .map((p) => ({
      ...p,
      phases: [...(p.project_phases ?? [])].sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed"));

  // The opening card: where the main engagement stands and what's next.
  const main = progress[0];
  const currentStage = main?.phases.find((p) => p.progress_pct < 100);
  const engagementDay = main?.start_date
    ? Math.max(1, Math.floor((currentTime() - new Date(`${main.start_date}T00:00:00`).getTime()) / 86_400_000) + 1)
    : null;
  const waiting = await loadWaiting(supabase, { orgId: org.id, projects });
  const nextDeliverable = (deliverableRows ?? []).find((d) => d.due_date && d.status !== "approved");
  const shortDate = (iso: string) =>
    new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const hero = {
    eyebrow: engagementDay ? `Day ${engagementDay} of your engagement` : (main?.name ?? org.name),
    title: currentStage ? `Now: ${currentStage.name}` : main?.phases.length ? "All stages complete" : (main?.name ?? org.name),
    subtitle:
      waiting.length > 0
        ? `${waiting.length} ${waiting.length === 1 ? "thing is" : "things are"} waiting on you — see the list below.`
        : nextDeliverable
          ? `Next deliverable: "${nextDeliverable.title}" · due ${shortDate(nextDeliverable.due_date!)}`
          : nextMeeting
            ? `Next meeting: ${nextMeeting.title} · ${shortDate(nextMeeting.scheduled_at)}`
            : "Your engagement is on track.",
  };

  const KPI_TILES = [
    { label: "Board items", value: cardCount ?? 0, icon: <ViewKanbanOutlined /> },
    { label: "Decisions logged", value: decisionCount ?? 0, icon: <ForumOutlined /> },
    { label: "Files", value: fileCount ?? 0, icon: <FolderOpenOutlined /> },
    {
      label: "Next meeting",
      icon: <VideocamOutlined />,
      value: nextMeeting
        ? new Date(nextMeeting.scheduled_at).toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
          })
        : "None",
    },
  ];

  return (
    <Stack spacing={5}>
      <DashboardHero eyebrow={hero.eyebrow} title={hero.title} subtitle={hero.subtitle} />

      <WaitingOnYou items={waiting} showProject={projects.length > 1} today={today} />

      <Stack spacing={3}>
        {progress.map((p) => (
          <ProjectProgress
            key={p.id}
            name={p.name}
            total={p.progress_pct}
            phases={p.phases}
            titleExtra={<StatusBadge status={p.status} />}
            markers={markersFor(p.id)}
            today={today}
          />
        ))}
      </Stack>

      <StatTiles tiles={KPI_TILES} />
    </Stack>
  );
}
