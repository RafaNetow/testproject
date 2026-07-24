import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { DecisionsView } from "@/components/decisions/decisions-view";

export default async function AdminProjectDecisionsPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.org_id !== orgId) notFound();

  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, title, body, decided_at, decision_participants(participant_name)")
    .eq("project_id", projectId)
    .order("decided_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to client
        </Link>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Decisions</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
      </div>

      <DecisionsView
        projectId={projectId}
        decisions={decisions ?? []}
        revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/decisions`]}
        canLog
        canDelete
      />
    </div>
  );
}
