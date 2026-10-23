/**
 * How many things happened in each of the last `weeks` weeks, oldest first —
 * the data behind the small trend lines on the Executive Summary. The last
 * bucket is the 7 days ending at `now`.
 */
export function weeklyCounts(dates: (string | null | undefined)[], weeks: number, now: Date): number[] {
  const counts = new Array<number>(weeks).fill(0);
  const end = now.getTime();
  const WEEK = 7 * 86_400_000;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d.length === 10 ? `${d}T12:00:00Z` : d).getTime();
    if (Number.isNaN(t) || t > end) continue;
    const ago = Math.floor((end - t) / WEEK);
    if (ago < weeks) counts[weeks - 1 - ago] += 1;
  }
  return counts;
}

/** Like weeklyCounts, but adds up a value per item (e.g. hours logged per week). */
export function weeklySums(items: { date: string | null | undefined; value: number }[], weeks: number, now: Date): number[] {
  const sums = new Array<number>(weeks).fill(0);
  const end = now.getTime();
  const WEEK = 7 * 86_400_000;
  for (const { date, value } of items) {
    if (!date) continue;
    const t = new Date(date.length === 10 ? `${date}T12:00:00Z` : date).getTime();
    if (Number.isNaN(t) || t > end) continue;
    const ago = Math.floor((end - t) / WEEK);
    if (ago < weeks) sums[weeks - 1 - ago] += value;
  }
  return sums.map((v) => Math.round(v * 10) / 10);
}

/** Short labels for the same weekly buckets, oldest first: the day each week starts ("12 Oct"). */
export function weekLabels(weeks: number, now: Date): string[] {
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(now.getTime() - (weeks - i) * 7 * 86_400_000 + 86_400_000);
    return start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  });
}

/** The ISO instant `weeks` weeks before `now`, for the query that feeds weeklyCounts. */
export function weeksAgo(weeks: number, now: Date): string {
  return new Date(now.getTime() - weeks * 7 * 86_400_000).toISOString();
}
