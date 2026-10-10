import { requireAxelAdmin, getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";
import { notificationHref } from "@/lib/notification-links";

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
    >
      {children}
    </AppShell>
  );
}
