import Link from "next/link";
import { VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";

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
  const now = Date.now();
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
      <div
        key={m.id}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-medium text-primary">{m.title}</p>
            <StatusBadge status={m.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {orgName} · {m.projects?.name ?? "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {when.toLocaleDateString("en-GB", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            {m.duration_minutes ? ` · ${m.duration_minutes} min` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {m.zoom_url && (
            <a
              href={m.zoom_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              <VideoCamera size={16} />
              Join
            </a>
          )}
          <Link
            href={`/admin/clients/${m.projects?.org_id}/projects/${m.project_id}/meetings`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Manage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionHeader eyebrow="Calendar" title="Meetings across all clients" />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-secondary">Upcoming</p>
        {!upcoming.length ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
        ) : (
          <div className="flex flex-col gap-3">{upcoming.map(renderMeeting)}</div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-secondary">Past &amp; cancelled</p>
        {!past.length ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <div className="flex flex-col gap-3">{past.map(renderMeeting)}</div>
        )}
      </div>
    </div>
  );
}
