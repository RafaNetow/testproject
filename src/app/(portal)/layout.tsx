import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  const supabase = await createClient();
  const [{ data: rows }, { data: membership }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, message, card_id, project_id, org_id, kind, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("org_memberships")
      .select("role")
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

  const notifications = (rows ?? []).map((n) => ({
    id: n.id,
    message: n.message,
    href: !n.project_id
      ? "/portal"
      : n.kind === "deliverable"
        ? `/portal/deliverables?project=${n.project_id}`
        : `/portal/board?project=${n.project_id}`,
    read: !!n.read_at,
    created_at: n.created_at,
  }));

  return (
    <AppShell
      variant="portal"
      brandLabel="Alchemica"
      subtitle="Client Portal"
      userEmail={user.email ?? ""}
      notifications={notifications}
      badges={{ "/portal/deliverables": awaitingReview ?? 0 }}
    >
      {children}
    </AppShell>
  );
}
