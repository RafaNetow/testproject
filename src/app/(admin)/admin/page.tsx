import Link from "next/link";
import { Buildings, CalendarBlank, Receipt, Target } from "@phosphor-icons/react/dist/ssr";
import { getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const QUICK_LINKS = [
  { label: "Clients", href: "/admin/clients", icon: Buildings },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarBlank },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Prospects", href: "/admin/prospects", icon: Target },
];

export default async function AdminDashboard() {
  const user = await getSessionUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-secondary">Active clients</p>
        <p className="mt-2 font-display text-4xl font-medium text-primary">{count ?? "—"}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-secondary">Quick links</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {QUICK_LINKS.map(({ label, href, icon: LinkIcon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted"
            >
              <LinkIcon size={22} className="text-accent" />
              <span className="text-sm font-medium text-primary">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
