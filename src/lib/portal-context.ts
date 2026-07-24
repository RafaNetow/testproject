import "server-only";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type PortalProject = { id: string; name: string; status: string };

/**
 * Resolves the signed-in client's org (a portal user belongs to exactly one)
 * and its projects, picking `selectedProjectId` if it's one of theirs,
 * otherwise the most recently created project.
 */
export async function getPortalProjectContext(selectedProjectId?: string) {
  const user = await requireSessionUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("org_memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { org: null, projects: [] as PortalProject[], project: null as PortalProject | null, role: null };
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  const projectList = projects ?? [];
  const project =
    projectList.find((p) => p.id === selectedProjectId) ?? projectList[0] ?? null;

  const orgRecord = membership.organizations as unknown as { name: string } | null;

  return {
    org: { id: membership.org_id, name: orgRecord?.name ?? "" },
    projects: projectList,
    project,
    role: membership.role as "owner" | "collaborator",
  };
}
