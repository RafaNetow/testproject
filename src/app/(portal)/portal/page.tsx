import Stack from "@mui/material/Stack";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { DashboardHero } from "@/components/shared/dashboard-hero";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTiles } from "@/components/shared/stat-tiles";
import { ActivityFeed, type ActivityItem } from "@/components/shared/activity-feed";

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
    { data: recentCards },
    { data: recentDecisions },
    { data: recentUpdates },
    { data: recentMeetings },
    { data: recentFiles },
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
      .from("board_cards")
      .select("id, title, created_at, project_id")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("decisions")
      .select("id, title, created_at, project_id")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("weekly_updates")
      .select("id, title, published_at, project_id")
      .in("project_id", projectIds)
      .order("published_at", { ascending: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, title, created_at, project_id")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("files")
      .select("id, filename, created_at, project_id")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const projectPath = (projectId: string, section: string) =>
    projects.length > 1 ? `/portal/${section}?project=${projectId}` : `/portal/${section}`;

  const activity: ActivityItem[] = [
    ...(recentCards ?? []).map((c) => ({
      type: "card" as const,
      label: `New board card: ${c.title}`,
      at: c.created_at,
      href: projectPath(c.project_id, "board"),
    })),
    ...(recentDecisions ?? []).map((d) => ({
      type: "decision" as const,
      label: `Decision logged: ${d.title}`,
      at: d.created_at,
      href: projectPath(d.project_id, "decisions"),
    })),
    ...(recentUpdates ?? []).map((u) => ({
      type: "update" as const,
      label: `Update published: ${u.title}`,
      at: u.published_at,
      href: projectPath(u.project_id, "updates"),
    })),
    ...(recentMeetings ?? []).map((m) => ({
      type: "meeting" as const,
      label: `Meeting scheduled: ${m.title}`,
      at: m.created_at,
      href: projectPath(m.project_id, "meetings"),
    })),
    ...(recentFiles ?? []).map((f) => ({
      type: "file" as const,
      label: `File uploaded: ${f.filename}`,
      at: f.created_at,
      href: projectPath(f.project_id, "files"),
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  const KPI_TILES = [
    { label: "Board items", value: cardCount ?? 0 },
    { label: "Decisions logged", value: decisionCount ?? 0 },
    { label: "Files", value: fileCount ?? 0 },
    {
      label: "Next meeting",
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

      <StatTiles tiles={KPI_TILES} />

      <ActivityFeed title="Recent activity" items={activity} emptyText="Nothing yet — check back soon." />
    </Stack>
  );
}
