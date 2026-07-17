import { getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const KPI_TILES = [
  { label: "Open board items" },
  { label: "Pending decisions" },
  { label: "Files" },
  { label: "Next meeting" },
];

export default async function PortalHome() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("role, organizations(name)")
    .eq("user_id", user?.id ?? "")
    .not("accepted_at", "is", null)
    .limit(1);

  const org = memberships?.[0]?.organizations as { name: string } | undefined;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Executive Summary
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">
          {org ? org.name : `Welcome, ${user?.email ?? "there"}`}
        </h1>
      </div>

      {!org && (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="font-display text-lg font-medium text-primary">
            Your workspace is being set up
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            Once you&apos;re added to a project, everything will show up here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_TILES.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-secondary">{tile.label}</p>
            <p className="mt-2 font-display text-3xl font-medium text-muted-foreground">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
