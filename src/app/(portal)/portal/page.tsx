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
      .select("id, name, status, progress_pct, project_phases(id, name, position, progress_pct)")
      .in("id", projectIds)
      .order("created_at", { ascending: false }),
  ]);

  // Active engagements first; each with its stages in the admin's order.
  const progress = (progressRows ?? [])
    .map((p) => ({
      ...p,
      phases: [...(p.project_phases ?? [])].sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed"));

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
      <DashboardHero name={org.name} subtitle="Here's where your engagement stands today." />

      <Stack spacing={3}>
        {progress.map((p) => (
          <ProjectProgress
            key={p.id}
            name={p.name}
            total={p.progress_pct}
            phases={p.phases}
            titleExtra={<StatusBadge status={p.status} />}
          />
        ))}
      </Stack>

      <StatTiles tiles={KPI_TILES} />
    </Stack>
  );
}
