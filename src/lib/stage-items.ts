import type { SupabaseClient } from "@supabase/supabase-js";

export type StageItemKind = "deliverable" | "meeting" | "request";

/** Something dated that belongs to a stage when its date falls inside the stage's dates. */
export type StageItem = { kind: StageItemKind; title: string; date: string; status: string; href: string };

/**
 * Deliverables, meetings and data requests for the given projects, grouped by
 * project. The timeline places each one in the stage whose dates contain it.
 * Works with the RLS-scoped client, so the portal never sees drafts.
 */
export async function loadStageItems(
  supabase: SupabaseClient,
  projectIds: string[],
  hrefFor: (kind: StageItemKind, projectId: string) => string
): Promise<Record<string, StageItem[]>> {
  if (!projectIds.length) return {};
  const [{ data: deliverables }, { data: meetings }, { data: requests }] = await Promise.all([
    supabase.from("deliverables").select("title, status, due_date, project_id").in("project_id", projectIds).not("due_date", "is", null),
    supabase.from("meetings").select("title, status, scheduled_at, project_id").in("project_id", projectIds),
    supabase.from("data_requests").select("title, status, due_date, project_id").in("project_id", projectIds).not("due_date", "is", null),
  ]);

  const byProject: Record<string, StageItem[]> = {};
  const add = (projectId: string, item: StageItem) => (byProject[projectId] ??= []).push(item);
  for (const d of deliverables ?? [])
    add(d.project_id, { kind: "deliverable", title: d.title, date: d.due_date!, status: d.status, href: hrefFor("deliverable", d.project_id) });
  for (const m of meetings ?? [])
    add(m.project_id, { kind: "meeting", title: m.title, date: m.scheduled_at.slice(0, 10), status: m.status, href: hrefFor("meeting", m.project_id) });
  for (const r of requests ?? [])
    add(r.project_id, { kind: "request", title: r.title, date: r.due_date!, status: r.status, href: hrefFor("request", r.project_id) });

  for (const list of Object.values(byProject)) list.sort((a, b) => a.date.localeCompare(b.date));
  return byProject;
}
