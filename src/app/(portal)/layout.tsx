import { requireSessionUser } from "@/lib/dal";
import { AppShell } from "@/components/shared/app-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return (
    <AppShell
      variant="portal"
      brandLabel="Alchemica"
      subtitle="Client Portal"
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
