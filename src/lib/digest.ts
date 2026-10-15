import type { SupabaseClient } from "@supabase/supabase-js";
import { loadWaiting, type WaitingItem } from "@/lib/waiting";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alchemica.dk";
const BRAND = "#2f7d6d";

export type DigestActivity = { kind: string; message: string; created_at: string };

export type DigestData = {
  firstName: string;
  orgName: string;
  activity: DigestActivity[];
  waiting: WaitingItem[];
  nextMeeting: { title: string; scheduled_at: string } | null;
  projects: { name: string; progress: number; stage: string | null }[];
};

const KIND_LABELS: Record<string, [string, string]> = {
  card: ["board update", "board updates"],
  deliverable: ["deliverable update", "deliverable updates"],
  file: ["file update", "file updates"],
  meeting: ["meeting update", "meeting updates"],
  decision: ["decision logged", "decisions logged"],
  update: ["progress update", "progress updates"],
  hours: ["time entry", "time entries"],
  invoice: ["invoice update", "invoice updates"],
  contract: ["contract update", "contract updates"],
  project: ["project update", "project updates"],
  team: ["team change", "team changes"],
  message: ["message", "messages"],
};

/** "3 board updates · 1 decision logged" — most frequent first. */
export function summarizeActivity(activity: DigestActivity[]): string[] {
  const counts = new Map<string, number>();
  for (const a of activity) counts.set(a.kind, (counts.get(a.kind) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kind, n]) => {
      const [one, many] = KIND_LABELS[kind] ?? ["update", "updates"];
      return `${n} ${n === 1 ? one : many}`;
    });
}

/** Nothing new, nothing waiting, nothing scheduled: don't send an empty email. */
export function digestIsWorthSending(d: DigestData) {
  return d.activity.length > 0 || d.waiting.length > 0 || d.nextMeeting !== null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const absolute = (href: string) => (/^https?:\/\//.test(href) ? href : `${SITE_URL}${href}`);
const dateLabel = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const VERB: Record<WaitingItem["kind"], string> = {
  review: "Review the deliverable",
  sign: "Sign",
  upload: "Send us",
  answer: "We need your input on",
  reply: "Read",
};

export function renderDigest(d: DigestData): { subject: string; html: string; text: string } {
  const summary = summarizeActivity(d.activity);
  const subject = d.waiting.length
    ? `Your week with Alchemica: ${d.waiting.length} ${d.waiting.length === 1 ? "thing needs" : "things need"} you`
    : `Your week with Alchemica: ${summary[0] ?? "what's next"}`;

  const section = (title: string, body: string) =>
    `<tr><td style="padding:24px 32px 0"><h2 style="margin:0 0 12px;font:700 16px/1.4 Arial,sans-serif;color:#17201e">${title}</h2>${body}</td></tr>`;

  const waitingHtml = d.waiting.length
    ? d.waiting
        .map(
          (w) =>
            `<p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif;color:#17201e">${VERB[w.kind]} <a href="${esc(absolute(w.href))}" style="color:${BRAND};font-weight:700">“${esc(w.title)}”</a>${w.due ? ` <span style="color:#627069">· due ${esc(dateLabel(w.due))}</span>` : ""}</p>`
        )
        .join("")
    : `<p style="margin:0;font:14px/1.5 Arial,sans-serif;color:#627069">Nothing is waiting on you this week.</p>`;

  const projectsHtml = d.projects
    .map(
      (p) =>
        `<p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif;color:#17201e"><strong>${esc(p.name)}</strong> — ${p.progress}% complete${p.stage ? `, now in <em>${esc(p.stage)}</em>` : ""}</p>`
    )
    .join("");

  const activityHtml = d.activity.length
    ? `<p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif;color:#627069">${esc(summary.join(" · "))}</p>` +
      d.activity
        .slice(0, 5)
        .map((a) => `<p style="margin:0 0 6px;font:14px/1.5 Arial,sans-serif;color:#17201e">• ${esc(a.message)}</p>`)
        .join("")
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f2f5f4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f4;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px">
<tr><td style="padding:28px 32px 0">
<p style="margin:0;font:700 12px/1 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${BRAND}">Alchemica · weekly summary</p>
<h1 style="margin:10px 0 0;font:700 22px/1.3 Arial,sans-serif;color:#17201e">Hi ${esc(d.firstName)}, here's your week with ${esc(d.orgName)}'s engagement</h1>
</td></tr>
${section(`Waiting on you${d.waiting.length ? ` (${d.waiting.length})` : ""}`, waitingHtml)}
${d.projects.length ? section("Where things stand", projectsHtml) : ""}
${d.nextMeeting ? section("Next meeting", `<p style="margin:0;font:14px/1.5 Arial,sans-serif;color:#17201e">${esc(d.nextMeeting.title)} · ${esc(dateLabel(d.nextMeeting.scheduled_at))}</p>`) : ""}
${activityHtml ? section("This week", activityHtml) : ""}
<tr><td style="padding:28px 32px 32px"><a href="${SITE_URL}/portal" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font:700 14px/1 Arial,sans-serif;padding:12px 20px;border-radius:8px">Open your portal</a>
<p style="margin:20px 0 0;font:12px/1.5 Arial,sans-serif;color:#627069">You get this every Monday. Turn it off any time under Team in your portal.</p></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Hi ${d.firstName}, here's your week with ${d.orgName}'s engagement.`,
    "",
    `WAITING ON YOU${d.waiting.length ? ` (${d.waiting.length})` : ""}`,
    ...(d.waiting.length ? d.waiting.map((w) => `- ${VERB[w.kind]} "${w.title}"${w.due ? ` (due ${dateLabel(w.due)})` : ""}: ${absolute(w.href)}`) : ["Nothing is waiting on you this week."]),
    ...(d.projects.length ? ["", "WHERE THINGS STAND", ...d.projects.map((p) => `- ${p.name}: ${p.progress}%${p.stage ? `, now in ${p.stage}` : ""}`)] : []),
    ...(d.nextMeeting ? ["", "NEXT MEETING", `${d.nextMeeting.title} · ${dateLabel(d.nextMeeting.scheduled_at)}`] : []),
    ...(d.activity.length ? ["", "THIS WEEK", summary.join(" · "), ...d.activity.slice(0, 5).map((a) => `- ${a.message}`)] : []),
    "",
    `Open your portal: ${SITE_URL}/portal`,
  ].join("\n");

  return { subject, html, text };
}

export type DigestRecipient = { profileId: string; email: string };

/**
 * Collects one client member's digest. Uses the service-role client, so it
 * must only ever run server-side (the weekly cron, the admin preview) with
 * a recipient chosen by the server — never from request input.
 */
export async function buildDigest(admin: SupabaseClient, profileId: string, now = new Date()): Promise<DigestData | null> {
  const { data: membership } = await admin
    .from("org_memberships")
    .select("org_id, organizations(name), profiles(full_name)")
    .eq("user_id", profileId)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const orgName = (membership.organizations as unknown as { name: string } | null)?.name ?? "your";
  const fullName = (membership.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "";
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const { data: projectRows } = await admin
    .from("projects")
    .select("id, name, status, progress_pct, project_phases(name, position, progress_pct)")
    .eq("org_id", membership.org_id);
  const projects = (projectRows ?? []).filter((p) => p.status !== "completed");
  const projectIds = projects.map((p) => p.id);

  const [{ data: activity }, waiting, { data: meeting }] = await Promise.all([
    admin
      .from("notifications")
      .select("kind, message, created_at")
      .eq("recipient_id", profileId)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    loadWaiting(admin, { orgId: membership.org_id, projects: projects.map((p) => ({ id: p.id, name: p.name })), userId: profileId }),
    projectIds.length
      ? admin
          .from("meetings")
          .select("title, scheduled_at")
          .in("project_id", projectIds)
          .eq("status", "upcoming")
          .gte("scheduled_at", now.toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    firstName: fullName.trim().split(/\s+/)[0] || "there",
    orgName,
    activity: activity ?? [],
    waiting,
    nextMeeting: meeting ?? null,
    projects: projects.map((p) => {
      const phases = [...((p.project_phases as { name: string; position: number; progress_pct: number }[]) ?? [])].sort(
        (a, b) => a.position - b.position
      );
      return { name: p.name, progress: p.progress_pct, stage: phases.find((ph) => ph.progress_pct < 100)?.name ?? null };
    }),
  };
}

/** Accepted client members who haven't opted out, with the address they were invited on. */
export async function digestRecipients(admin: SupabaseClient): Promise<DigestRecipient[]> {
  const { data } = await admin
    .from("org_memberships")
    .select("user_id, invited_email, profiles!inner(weekly_digest)")
    .not("user_id", "is", null)
    .not("accepted_at", "is", null)
    .eq("profiles.weekly_digest", true);
  return (data ?? []).map((m) => ({ profileId: m.user_id as string, email: m.invited_email as string }));
}
