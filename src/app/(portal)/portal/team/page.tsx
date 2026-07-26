import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { updateOrgDetails } from "@/lib/actions/organization-details";
import { SectionHeader } from "@/components/shared/section-header";

export default async function TeamPage() {
  const { org, role } = await getPortalProjectContext();

  if (!org) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Team" title="Team" />
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No workspace yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once you&apos;re added to a project, your team will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("org_memberships")
    .select("id, invited_email, role, accepted_at")
    .eq("org_id", org.id)
    .not("accepted_at", "is", null)
    .order("role");

  const updateThisOrg = updateOrgDetails.bind(null, org.id);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Team" title={org.name} />

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Company details</p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          For your invoices
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Your CVR number and billing address appear on invoices we send you.
        </p>

        {role === "owner" ? (
          <form action={updateThisOrg} className="mt-5 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cvr_number" className="text-sm font-medium text-secondary">
                CVR number
              </label>
              <input
                id="cvr_number"
                name="cvr_number"
                defaultValue={org.cvrNumber ?? ""}
                placeholder="12345678"
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
              <label htmlFor="billing_address" className="text-sm font-medium text-secondary">
                Billing address
              </label>
              <input
                id="billing_address"
                name="billing_address"
                defaultValue={org.billingAddress ?? ""}
                placeholder="Street, postal code, city"
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              />
            </div>
            <button
              type="submit"
              className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Save
            </button>
          </form>
        ) : (
          <div className="mt-5 flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">CVR number</p>
              <p className="mt-0.5 text-primary">{org.cvrNumber || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing address</p>
              <p className="mt-0.5 text-primary">{org.billingAddress || "Not set"}</p>
            </div>
          </div>
        )}
      </div>

      {!members?.length ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UsersThree size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{m.invited_email}</p>
                <p className="text-xs text-muted-foreground">
                  {m.role === "owner" ? "Owner" : "Collaborator"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
