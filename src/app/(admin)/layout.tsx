import { requireAxelAdmin, getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";
import { notificationHref } from "@/lib/notification-links";
import { loadUnread } from "@/lib/messages";
import { aiConfigured } from "@/lib/ai/provider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAxelAdmin();
  const user = await getSessionUser();

  const supabase = await createClient();
  const { data: rows } = user
    ? await supabase
        .from("notifications")
        .select("id, message, card_id, project_id, org_id, kind, read_at, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  const unread = user ? await loadUnread(supabase, user.id) : {};
  const { data: profile } = user
    ? await supabase.from("profiles").select("tour_completed_at").eq("id", user.id).maybeSingle()
    : { data: null };
  const unreadMessages = Object.values(unread).reduce((a, b) => a + b, 0);

  const notifications = (rows ?? []).map((n) => ({
    id: n.id,
    message: n.message,
    kind: n.kind,
    href: notificationHref(n, "admin"),
    read: !!n.read_at,
    created_at: n.created_at,
  }));

  return (
    <AppShell
      variant="admin"
      brandLabel="Alchemica"
      subtitle="Admin"
      userEmail={user?.email ?? ""}
      userId={user?.id ?? ""}
      notifications={notifications}
      chat={{ unread: unreadMessages, aiEnabled: aiConfigured() }}
      tourPending={Boolean(user && profile && !profile.tour_completed_at)}
    >
      {children}
    </AppShell>
  );
}
