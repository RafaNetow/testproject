import Link from "next/link";
import {
  ChatCircleDots,
  FolderOpen,
  NotePencil,
  SquaresFour,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { DashboardHero } from "@/components/shared/dashboard-hero";
import { SectionHeader } from "@/components/shared/section-header";

type ActivityItem = {
  type: "card" | "decision" | "update" | "meeting" | "file";
  label: string;
  at: string;
  href: string;
};

export default async function PortalHome() {
  const { org, projects } = await getPortalProjectContext();

  if (!org) {
    return (
      <div className="flex flex-col gap-10">
        <SectionHeader eyebrow="Executive Summary" title="Welcome" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="font-display text-lg font-medium text-primary">
            Your workspace is being set up
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            Once you&apos;re added to a project, everything will show up here.
          </p>
        </div>
      </div>
    );
  }

  const projectIds = projects.map((p) => p.id);

  if (!projectIds.length) {
    return (
      <div className="flex flex-col gap-10">
        <SectionHeader eyebrow="Executive Summary" title={org.name} />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="font-display text-lg font-medium text-primary">
            Your first project is being set up
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            Once it&apos;s ready, your board, files, and decisions will show up here.
          </p>
        </div>
      </div>
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

  const ACTIVITY_ICONS = {
    card: SquaresFour,
    decision: ChatCircleDots,
    update: NotePencil,
    meeting: VideoCamera,
    file: FolderOpen,
  };

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
    <div className="flex flex-col gap-10">
      <DashboardHero name={org.name} subtitle="Here's where your engagement stands today." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_TILES.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-secondary">{tile.label}</p>
            <p className="mt-2 font-display text-3xl font-medium text-primary">{tile.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-secondary">Recent activity</p>
        {!activity.length ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing yet — check back soon.</p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {activity.map((item, i) => {
              const ItemIcon = ACTIVITY_ICONS[item.type];
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ItemIcon size={15} />
                  </div>
                  <p className="flex-1 truncate text-sm text-primary">{item.label}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.at).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
