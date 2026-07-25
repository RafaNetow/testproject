import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { MeetingsView } from "@/components/meetings/meetings-view";

export default async function AdminProjectMeetingsPage({
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

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, zoom_url, scheduled_at, duration_minutes, status, notes")
    .eq("project_id", projectId)
    .order("scheduled_at", { ascending: false });

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
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Meetings</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
      </div>

      <MeetingsView
        projectId={projectId}
        meetings={meetings ?? []}
        revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/meetings`]}
        canManage
      />
    </div>
  );
}
