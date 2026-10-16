import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadWaiting } from "@/lib/waiting";
import { formatContext, type ProjectData, type SourceKind } from "./format";

/**
 * Loads one project's data for the assistant with the CALLER's Supabase client
 * (their own session, under Row-Level Security). A client asking about a
 * project outside their organisation gets nothing back, because the database
 * refuses it — the AI path never uses the service-role key.
 */
export async function buildProjectContext(
  supabase: SupabaseClient,
  projectId: string,
  { surface, userId }: { surface: "portal" | "admin"; userId: string }
) {
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, status, progress_pct, org_id, project_phases(name, position, progress_pct, start_date, end_date, description)")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const [{ data: decisions }, { data: deliverables }, { data: requests }, { data: messages }, waiting] = await Promise.all([
    supabase.from("decisions").select("title, body, decided_at").eq("project_id", projectId).order("decided_at", { ascending: false }).limit(20),
    supabase.from("deliverables").select("title, status, due_date").eq("project_id", projectId).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("data_requests").select("title, status, due_date").eq("project_id", projectId).order("created_at"),
    supabase.from("messages").select("body, created_at, author_id").eq("project_id", projectId).order("created_at", { ascending: false }).limit(15),
    loadWaiting(supabase, { orgId: project.org_id, projects: [{ id: project.id, name: project.name }], userId }),
  ]);

  // Names only — never email addresses — for the people in the thread.
  const { data: people } = await supabase.rpc("thread_participants", { p_project: projectId });
  const nameOf = new Map(((people ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]));

  type PhaseRow = ProjectData["phases"][number] & { position: number };
  const phases = [...((project.project_phases ?? []) as PhaseRow[])].sort((a, b) => a.position - b.position);

  const data: ProjectData = {
    name: project.name,
    status: project.status,
    progressPct: project.progress_pct,
    phases,
    decisions: decisions ?? [],
    deliverables: deliverables ?? [],
    requests: requests ?? [],
    waiting: waiting.map((w) => w.title),
    messages: [...(messages ?? [])].reverse().map((m) => ({ author: nameOf.get(m.author_id) ?? "Someone", body: m.body, created_at: m.created_at })),
  };

  const base =
    surface === "portal" ? `/portal` : `/admin/clients/${project.org_id}/projects/${project.id}`;
  const section: Record<SourceKind, string> = { stage: "", decision: "decisions", deliverable: "deliverables", request: "files" };
  const hrefFor = (kind: SourceKind) => {
    if (surface === "portal") return kind === "stage" ? `${base}` : `${base}/${section[kind]}?project=${project.id}`;
    return kind === "stage" ? `/admin/clients/${project.org_id}` : `${base}/${section[kind]}`;
  };

  const today = new Date().toISOString().slice(0, 10);
  return { orgId: project.org_id as string, projectName: project.name as string, ...formatContext(data, today, hrefFor) };
}
