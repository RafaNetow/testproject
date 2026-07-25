import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";

export default async function TeamPage() {
  const { org } = await getPortalProjectContext();

  if (!org) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Team</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">Team</h1>
        </div>
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Team</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{org.name}</h1>
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
