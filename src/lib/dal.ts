import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer — the real authorization boundary. proxy.ts only does a
 * cheap, optimistic cookie-based redirect; every Server Component, Server
 * Action, and Route Handler that touches tenant data must call one of these
 * (or rely on Postgres RLS directly) so a forged cookie can never actually
 * read another org's rows.
 */

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function isAxelAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  return data?.platform_role === "axel_admin";
}

export async function requireAxelAdmin() {
  await requireSessionUser();
  if (!(await isAxelAdmin())) redirect("/portal");
}

export async function requireOrgMember(orgId: string) {
  const user = await requireSessionUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();

  if (!data) redirect("/portal");
  return data.role as "owner" | "collaborator";
}

export async function requireOwnerRole(orgId: string) {
  const role = await requireOrgMember(orgId);
  if (role !== "owner") redirect("/portal");
}
