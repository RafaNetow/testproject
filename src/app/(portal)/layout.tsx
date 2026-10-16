import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";
import { notificationHref } from "@/lib/notification-links";
import { loadUnread } from "@/lib/messages";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  const supabase = await createClient();
  const [{ data: rows }, { data: membership }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, message, card_id, project_id, org_id, kind, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("org_memberships")
      .select("role, org_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .limit(1)
      .maybeSingle(),
  ]);

  // Only the workspace owner can act on a deliverable, so only they get a
  // "waiting on you" counter. Row-Level Security already limits this to
  // their own organization and hides drafts.
  const { count: awaitingReview } =
    membership?.role === "owner"
      ? await supabase
          .from("deliverables")
          .select("id", { count: "exact", head: true })
          .eq("status", "in_review")
      : { count: 0 };

  // Unread messages across the client's projects (RLS limits this to their org).
  const [unread, { data: projects }] = await Promise.all([
    loadUnread(supabase, user.id),
    membership
      ? supabase.from("projects").select("id, name").eq("org_id", membership.org_id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const unreadMessages = Object.values(unread).reduce((a, b) => a + b, 0);

  const notifications = (rows ?? []).map((n) => ({
    id: n.id,
    message: n.message,
    kind: n.kind,
    href: notificationHref(n, "portal"),
    read: !!n.read_at,
    created_at: n.created_at,
  }));

  return (
    <AppShell
      variant="portal"
      brandLabel="Alchemica"
      subtitle="Client Portal"
      userEmail={user.email ?? ""}
      userId={user.id}
      notifications={notifications}
      badges={{ "/portal/deliverables": awaitingReview ?? 0 }}
      chat={{ unread: unreadMessages, projects: projects ?? [] }}
    >
      {children}
    </AppShell>
  );
}
