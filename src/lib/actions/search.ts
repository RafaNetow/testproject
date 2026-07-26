"use server";

import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  type: "client" | "project" | "invoice" | "contract";
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

/** Admin-only cross-entity search — clients, projects, invoices, contracts by name/number/title. */
export async function searchAdmin(query: string): Promise<SearchResult[]> {
  await requireAxelAdmin();
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);

  const [{ data: orgs }, { data: projects }, { data: invoices }, { data: contracts }] =
    await Promise.all([
      supabase.from("organizations").select("id, name").ilike("name", `%${escaped}%`).limit(5),
      supabase
        .from("projects")
        .select("id, name, org_id, organizations(name)")
        .ilike("name", `%${escaped}%`)
        .limit(5),
      supabase
        .from("invoices")
        .select("id, invoice_number, org_id, project_id, organizations(name)")
        .ilike("invoice_number", `%${escaped}%`)
        .limit(5),
      supabase
        .from("contracts")
        .select("id, title, org_id, project_id, organizations(name)")
        .ilike("title", `%${escaped}%`)
        .limit(5),
    ]);

  const results: SearchResult[] = [];

  for (const o of orgs ?? []) {
    results.push({ type: "client", id: o.id, label: o.name, sublabel: "Client", href: `/admin/clients/${o.id}` });
  }
  for (const p of projects ?? []) {
    const orgName = (p.organizations as unknown as { name: string } | null)?.name ?? "";
    results.push({
      type: "project",
      id: p.id,
      label: p.name,
      sublabel: orgName ? `Project — ${orgName}` : "Project",
      href: `/admin/clients/${p.org_id}/projects/${p.id}/board`,
    });
  }
  for (const inv of invoices ?? []) {
    const orgName = (inv.organizations as unknown as { name: string } | null)?.name ?? "";
    results.push({
      type: "invoice",
      id: inv.id,
      label: inv.invoice_number,
      sublabel: orgName ? `Invoice — ${orgName}` : "Invoice",
      href: `/admin/clients/${inv.org_id}/projects/${inv.project_id}/invoices`,
    });
  }
  for (const c of contracts ?? []) {
    const orgName = (c.organizations as unknown as { name: string } | null)?.name ?? "";
    results.push({
      type: "contract",
      id: c.id,
      label: c.title,
      sublabel: orgName ? `Contract — ${orgName}` : "Contract",
      href: `/admin/clients/${c.org_id}/projects/${c.project_id}/contracts`,
    });
  }

  return results;
}
