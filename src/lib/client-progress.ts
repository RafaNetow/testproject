export type ProjectProgressRow = { org_id: string; status: string; progress_pct: number };

/**
 * Each client's overall progress: the average of its projects that are still
 * running (completed ones would only pull it towards 100). Clients whose
 * projects are all completed show 100; clients without projects are absent.
 */
export function clientProgress(projects: ProjectProgressRow[]): Map<string, { pct: number; projects: number }> {
  const byOrg = new Map<string, ProjectProgressRow[]>();
  for (const p of projects) byOrg.set(p.org_id, [...(byOrg.get(p.org_id) ?? []), p]);
  const out = new Map<string, { pct: number; projects: number }>();
  for (const [org, list] of byOrg) {
    const running = list.filter((p) => p.status !== "completed");
    const pct = running.length ? Math.round(running.reduce((n, p) => n + p.progress_pct, 0) / running.length) : 100;
    out.set(org, { pct, projects: list.length });
  }
  return out;
}
