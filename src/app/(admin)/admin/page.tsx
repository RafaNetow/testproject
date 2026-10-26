import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LinkBox } from "@/components/shared/link-box";
import { createClient } from "@/lib/supabase/server";
import { requireSessionUser } from "@/lib/dal";
import { firstName } from "@/lib/first-name";
import { DashboardHero } from "@/components/shared/dashboard-hero";
import { StatTiles } from "@/components/shared/stat-tiles";
import { ActivityFeed, type ActivityItem } from "@/components/shared/activity-feed";
import { BusinessOutlined, CalendarMonthOutlined, ReceiptLongOutlined, TrackChangesOutlined, WorkOutlineOutlined } from "@/components/icons";

const QUICK_LINKS = [
  { label: "Clients", href: "/admin/clients", icon: BusinessOutlined },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarMonthOutlined },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptLongOutlined },
  { label: "Prospects", href: "/admin/prospects", icon: TrackChangesOutlined },
];

type WithProject = {
  project_id: string;
  projects: { name: string; org_id: string; organizations: { name: string } | null } | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const user = await requireSessionUser();
  const greetName = await firstName(supabase, user.id);

  const [
    { count: orgCount },
    { count: projectCount },
    { count: upcomingMeetingsCount },
    { data: recentCards },
    { data: recentDecisions },
    { data: recentUpdates },
    { data: recentMeetings },
    { data: recentFiles },
    { count: activeEngagements },
    { count: awaitingClients },
    { data: nextMeeting },
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
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("status", "in_review"),
    supabase
      .from("meetings")
      .select("title, scheduled_at, projects(organizations(name))")
      .eq("status", "upcoming")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const meetingClient = (nextMeeting?.projects as unknown as { organizations: { name: string } | null } | null)?.organizations?.name;
  const hero = {
    eyebrow: `${activeEngagements ?? 0} active ${activeEngagements === 1 ? "engagement" : "engagements"}`,
    title: awaitingClients
      ? `${awaitingClients} ${awaitingClients === 1 ? "deliverable" : "deliverables"} waiting on clients`
      : "Nothing waiting on clients",
    subtitle: nextMeeting
      ? `Next meeting: ${nextMeeting.title}${meetingClient ? ` with ${meetingClient}` : ""} · ${new Date(nextMeeting.scheduled_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`
      : "No meetings scheduled.",
  };

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
      sublabel: orgNameOf(c),
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
      sublabel: orgNameOf(d),
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
      sublabel: orgNameOf(u),
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
      sublabel: orgNameOf(m),
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
      sublabel: orgNameOf(f),
      href: sectionHref(f, "files"),
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return (
    <Stack spacing={5} className="stagger">
      <DashboardHero eyebrow={hero.eyebrow} title={hero.title} subtitle={hero.subtitle} greetName={greetName} />

      <Box data-tour="dashboard-stats">
      <StatTiles
        animate
        columns={3}
        tiles={[
          { label: "Active clients", value: orgCount ?? "—", icon: <BusinessOutlined /> },
          { label: "Projects", value: projectCount ?? "—", icon: <WorkOutlineOutlined /> },
          { label: "Upcoming meetings", value: upcomingMeetingsCount ?? "—", icon: <CalendarMonthOutlined /> },
        ]}
      />
      </Box>

      <div>
        <Typography variant="h2" sx={{ fontSize: 18 }}>
          Quick links
        </Typography>
        <Box sx={{ mt: 2, display: "grid", gap: 3, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" } }}>
          {QUICK_LINKS.map(({ label, href, icon: LinkIcon }) => (
            <LinkBox
              key={href}
              href={href}
              sx={{
                borderRadius: 2,
                boxShadow: "var(--shadow-card)",
                bgcolor: "background.paper",
                color: "text.primary",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1.5,
                p: 2.5,
                textDecoration: "none",
                transition: "transform 200ms",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "primary.main",
                }}
              >
                <LinkIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{label}</Typography>
            </LinkBox>
          ))}
        </Box>
      </div>

      <ActivityFeed title="Recent activity across all clients" items={activity} emptyText="Nothing yet." />
    </Stack>
  );
}
