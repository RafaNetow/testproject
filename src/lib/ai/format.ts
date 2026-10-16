import { phaseSchedule } from "@/lib/phase-schedule";

/**
 * Turns a project's data into the compact PROJECT DATA block the model reads,
 * with a citable id per item, and maps the ids the model cites back to links.
 * Pure (no database, no network) so it can be unit-tested.
 *
 * Only what the assistant needs goes in: no invoices, hours, rates, email
 * addresses or file contents — and only the one project being asked about.
 */

export type SourceKind = "stage" | "decision" | "deliverable" | "request";
export type Source = { id: string; kind: SourceKind; title: string; href: string };

export type ProjectData = {
  name: string;
  status: string;
  progressPct: number;
  phases: { name: string; progress_pct: number; start_date: string | null; end_date: string | null; description: string | null }[];
  decisions: { title: string; body: string | null; decided_at: string }[];
  deliverables: { title: string; status: string; due_date: string | null }[];
  requests: { title: string; status: string; due_date: string | null }[];
  waiting: string[];
  messages: { author: string; body: string; created_at: string }[];
};

const clip = (text: string, max: number) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "no date");

export function formatContext(data: ProjectData, today: string, hrefFor: (kind: SourceKind) => string) {
  const sources: Source[] = [];
  const add = (prefix: string, kind: SourceKind, title: string) => {
    const id = `${prefix}${sources.filter((s) => s.kind === kind).length + 1}`;
    sources.push({ id, kind, title, href: hrefFor(kind) });
    return id;
  };

  const lines: string[] = [];
  lines.push(`Project: ${data.name} (status: ${data.status}, overall progress ${data.progressPct}%). Today is ${today}.`);

  lines.push("", "STAGES");
  for (const p of data.phases) {
    const id = add("s", "stage", p.name);
    const schedule = phaseSchedule({ start: p.start_date, end: p.end_date, pct: p.progress_pct, today });
    lines.push(
      `[${id}] ${p.name} — ${p.progress_pct}% · ${day(p.start_date)} to ${day(p.end_date)}${schedule ? ` · ${schedule.label}` : ""}` +
        (p.description ? ` · What happens: ${clip(p.description, 300)}` : "")
    );
  }

  lines.push("", "DECISIONS (newest first)");
  if (!data.decisions.length) lines.push("None logged yet.");
  for (const d of data.decisions) {
    const id = add("d", "decision", d.title);
    lines.push(`[${id}] ${day(d.decided_at)} — ${clip(d.title, 160)}${d.body ? `: ${clip(d.body, 300)}` : ""}`);
  }

  lines.push("", "DELIVERABLES");
  if (!data.deliverables.length) lines.push("None yet.");
  for (const v of data.deliverables) {
    const id = add("v", "deliverable", v.title);
    lines.push(`[${id}] ${clip(v.title, 160)} — status: ${v.status.replaceAll("_", " ")} · due ${day(v.due_date)}`);
  }

  lines.push("", "DATA ALCHEMICA HAS REQUESTED FROM THE CLIENT");
  if (!data.requests.length) lines.push("None.");
  for (const r of data.requests) {
    const id = add("r", "request", r.title);
    lines.push(`[${id}] ${clip(r.title, 160)} — ${r.status} · needed by ${day(r.due_date)}`);
  }

  lines.push("", "WAITING ON THE CLIENT");
  lines.push(...(data.waiting.length ? data.waiting.map((w) => `- ${clip(w, 200)}`) : ["Nothing."]));

  lines.push("", "RECENT MESSAGES (oldest first)");
  if (!data.messages.length) lines.push("None.");
  for (const m of data.messages) lines.push(`${day(m.created_at)} ${m.author}: ${clip(m.body, 400)}`);

  return { text: `PROJECT DATA\n${lines.join("\n")}\nEND OF PROJECT DATA`, sources };
}

/** The sources the answer actually cites, in order of first mention, without duplicates. */
export function citedSources(answer: string, sources: Source[]) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const match of answer.matchAll(/\[([sdvr]\d{1,3})\]/g)) {
    const s = byId.get(match[1]);
    if (s && !seen.has(s.id)) {
      seen.add(s.id);
      out.push(s);
    }
  }
  return out;
}

/** Removes the [s1]-style markers for display; the cited sources are shown as chips instead. */
export function stripCitations(answer: string) {
  return answer.replace(/\s?\[[sdvr]\d{1,3}\]/g, "").replace(/[ \t]+\n/g, "\n").trim();
}
