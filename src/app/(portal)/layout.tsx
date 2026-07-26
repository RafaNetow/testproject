import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, message, card_id, project_id, org_id, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const notifications = (rows ?? []).map((n) => ({
    id: n.id,
    message: n.message,
    href: n.project_id ? `/portal/board?project=${n.project_id}` : "/portal",
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
    >
      {children}
    </AppShell>
  );
}
