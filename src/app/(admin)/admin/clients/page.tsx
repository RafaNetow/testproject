import Link from "next/link";
import { Buildings, Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { createOrganization } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  onboarding: "bg-accent/10 text-accent",
  active: "bg-emerald-100 text-emerald-700",
  at_risk: "bg-amber-100 text-amber-700",
  offboarded: "bg-muted text-muted-foreground",
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Clients</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">All clients</h1>
      </div>

      <form
        action={createOrganization}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-secondary">
            New client name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Acme Materials"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
        >
          <Plus size={16} weight="bold" />
          Add client
        </button>
      </form>

      {!organizations?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Buildings size={28} className="text-accent" />
          <p className="font-display text-lg font-medium text-primary">No clients yet</p>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Add your first client above to start building out their workspace.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted"
                >
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${org.id}`}
                      className="block px-5 py-3.5 font-medium text-primary"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/admin/clients/${org.id}`}
                      className="flex items-center px-5 py-3.5"
                    >
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[org.status] ?? STATUS_STYLES.onboarding
                        }`}
                      >
                        {org.status.replace("_", " ")}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
