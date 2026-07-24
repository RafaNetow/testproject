import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { InviteForm } from "./invite-form";
import { removeMember, updateOrganization, deleteOrganization } from "./actions";

const STATUS_OPTIONS = ["onboarding", "active", "at_risk", "offboarded"] as const;

const STATUS_STYLES: Record<string, string> = {
  onboarding: "bg-accent/10 text-accent",
  active: "bg-emerald-100 text-emerald-700",
  at_risk: "bg-amber-100 text-amber-700",
  offboarded: "bg-muted text-muted-foreground",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, status")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) notFound();

  const { data: members } = await supabase
    .from("org_memberships")
    .select("id, invited_email, role, accepted_at, invited_at")
    .eq("org_id", orgId)
    .order("invited_at", { ascending: false });

  const updateThisOrg = updateOrganization.bind(null, orgId);
  const deleteThisOrg = deleteOrganization.bind(null, orgId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          All clients
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-medium text-primary">
            {org.name}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[org.status] ?? STATUS_STYLES.onboarding
            }`}
          >
            {org.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Details
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Edit client
        </h2>
        <form action={updateThisOrg} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-secondary">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={org.name}
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-secondary">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={org.status}
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Save changes
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Team
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Invite someone to this workspace
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          They&apos;ll be able to sign in at the client login using this
          email — no account setup needed on their end.
        </p>

        <InviteForm orgId={orgId} />

        {!members?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No one invited yet.
          </p>
        ) : (
          <div className="mt-6 divide-y divide-border border-t border-border">
            {members.map((m) => {
              const removeThisMember = removeMember.bind(null, orgId, m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {m.invited_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.role === "owner" ? "Owner" : "Collaborator"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        m.accepted_at
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.accepted_at ? "Active" : "Pending"}
                    </span>
                    <form action={removeThisMember}>
                      <ConfirmButton
                        confirmText={`Remove ${m.invited_email} from ${org.name}? They'll lose access immediately.`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={16} />
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-destructive">
          Danger zone
        </p>
        <h2 className="mt-2 font-display text-lg font-medium text-primary">
          Delete this client
        </h2>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          Permanently deletes {org.name} and everything under it — team
          access, board, files, decisions, invoices. This can&apos;t be
          undone.
        </p>
        <form action={deleteThisOrg} className="mt-4">
          <ConfirmButton
            confirmText={`Permanently delete ${org.name} and everything under it? This can't be undone.`}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            <Trash size={16} weight="bold" />
            Delete client
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
