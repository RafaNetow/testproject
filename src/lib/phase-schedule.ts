export type ScheduleTone = "neutral" | "accent" | "warning";

const DAY = 86_400_000;
const toMs = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Plain-language schedule status for one stage, from its dates and %.
 * "On track" allows ten points of slack against straight-line progress, so a
 * stage isn't flagged for being a day or two behind an idealised pace.
 */
export function phaseSchedule({
  start,
  end,
  pct,
  today,
}: {
  start: string | null | undefined;
  end: string | null | undefined;
  pct: number;
  today: string;
}): { label: string; tone: ScheduleTone } | null {
  if (pct >= 100) return { label: "Done", tone: "neutral" };
  if (!start || !end) return null;

  const s = toMs(start);
  const e = toMs(end) + DAY; // the end date is inclusive
  const t = toMs(today);
  const totalDays = Math.max(1, Math.round((e - s) / DAY));

  if (t < s) return { label: `Starts in ${plural(Math.round((s - t) / DAY), "day")}`, tone: "neutral" };
  if (t >= e) return { label: `${plural(Math.round((t - e) / DAY) + 1, "day")} overdue`, tone: "warning" };

  const expected = ((t - s) / (e - s)) * 100;
  if (pct >= expected - 10) return { label: "On track", tone: "accent" };
  const behind = Math.max(1, Math.round(((expected - pct) / 100) * totalDays));
  return { label: `About ${plural(behind, "day")} behind`, tone: "warning" };
}
