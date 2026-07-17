import { requireAxelAdmin, getSessionUser } from "@/lib/dal";
import { AppShell } from "@/components/shared/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAxelAdmin();
  const user = await getSessionUser();

  return (
    <AppShell
      variant="admin"
      brandLabel="Alchemica"
      subtitle="Admin"
      userEmail={user?.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
