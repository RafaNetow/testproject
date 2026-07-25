import Link from "next/link";
import {
  Buildings,
  CalendarBlank,
  ChatCircleDots,
  FolderOpen,
  NotePencil,
  Receipt,
  SquaresFour,
  Target,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const QUICK_LINKS = [
  { label: "Clients", href: "/admin/clients", icon: Buildings },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarBlank },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Prospects", href: "/admin/prospects", icon: Target },
];

type ActivityItem = {
  type: "card" | "decision" | "update" | "meeting" | "file";
  label: string;
  at: string;
  orgName: string;
  href: string;
};

type WithProject = {
  project_id: string;
  projects: { name: string; org_id: string; organizations: { name: string } | null } | null;
};

export default async function AdminDashboard() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const [
    { count: orgCount },
    { count: projectCount },
    { count: upcomingMeetingsCount },
    { data: recentCards },
    { data: recentDecisions },
    { data: recentUpdates },
    { data: recentMeetings },
    { data: recentFiles },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("status", "upcoming")
      .gte("scheduled_at", new Date().toISOString()),
    supabase
      .from("board_cards")
      .select("id, title, created_at, project_id, projects(name, org_id, organizations(name))")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("decisions")
      .select("id, title, created_at, project_id, projects(name, org_id, organizations(name))")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("weekly_updates")
      .select(
        "id, title, published_at, project_id, projects(name, org_id, organizations(name))"
      )
      .order("published_at", { ascending: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, title, created_at, project_id, projects(name, org_id, organizations(name))")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("files")
      .select(
        "id, filename, created_at, project_id, projects(name, org_id, organizations(name))"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sectionHref = (row: WithProject, section: string) =>
    row.projects
      ? `/admin/clients/${row.projects.org_id}/projects/${row.project_id}/${section}`
      : "/admin/clients";

  const orgNameOf = (row: WithProject) => row.projects?.organizations?.name ?? "—";

  const activity: ActivityItem[] = [
    ...(((recentCards ?? []) as unknown) as (WithProject & {
      id: string;
      title: string;
      created_at: string;
    })[]).map((c) => ({
      type: "card" as const,
      label: `New board card: ${c.title}`,
      at: c.created_at,
      orgName: orgNameOf(c),
      href: sectionHref(c, "board"),
    })),
    ...(((recentDecisions ?? []) as unknown) as (WithProject & {
      id: string;
      title: string;
      created_at: string;
    })[]).map((d) => ({
      type: "decision" as const,
      label: `Decision logged: ${d.title}`,
      at: d.created_at,
      orgName: orgNameOf(d),
      href: sectionHref(d, "decisions"),
    })),
    ...(((recentUpdates ?? []) as unknown) as (WithProject & {
      id: string;
      title: string;
      published_at: string;
    })[]).map((u) => ({
      type: "update" as const,
      label: `Update published: ${u.title}`,
      at: u.published_at,
      orgName: orgNameOf(u),
      href: sectionHref(u, "updates"),
    })),
    ...(((recentMeetings ?? []) as unknown) as (WithProject & {
      id: string;
      title: string;
      created_at: string;
    })[]).map((m) => ({
      type: "meeting" as const,
      label: `Meeting scheduled: ${m.title}`,
      at: m.created_at,
      orgName: orgNameOf(m),
      href: sectionHref(m, "meetings"),
    })),
    ...(((recentFiles ?? []) as unknown) as (WithProject & {
      id: string;
      filename: string;
      created_at: string;
    })[]).map((f) => ({
      type: "file" as const,
      label: `File uploaded: ${f.filename}`,
      at: f.created_at,
      orgName: orgNameOf(f),
      href: sectionHref(f, "files"),
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  const ACTIVITY_ICONS = {
    card: SquaresFour,
    decision: ChatCircleDots,
    update: NotePencil,
    meeting: VideoCamera,
    file: FolderOpen,
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Active clients</p>
          <p className="mt-2 font-display text-4xl font-medium text-primary">{orgCount ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Projects</p>
          <p className="mt-2 font-display text-4xl font-medium text-primary">
            {projectCount ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-secondary">Upcoming meetings</p>
          <p className="mt-2 font-display text-4xl font-medium text-primary">
            {upcomingMeetingsCount ?? "—"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-secondary">Quick links</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {QUICK_LINKS.map(({ label, href, icon: LinkIcon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted"
            >
              <LinkIcon size={22} className="text-accent" />
              <span className="text-sm font-medium text-primary">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-secondary">Recent activity across all clients</p>
        {!activity.length ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-primary">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.orgName}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.at).toLocaleDateString(undefined, {
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
