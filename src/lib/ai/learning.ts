/**
 * What the admin copilot learns from Axel: his past corrections, his rules and
 * an anonymised case book. Pure functions (no database, no network) so they
 * can be tested; src/lib/actions/ai.ts feeds them real data.
 */

export type Example = { draft: string; final: string };
export type CaseStudy = { id: string; title: string; problem: string; findings: string; outcome: string; tags: string[] };

const clip = (text: string, max: number) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// Words that appear in names but are also ordinary vocabulary: never scrubbed on their own.
const GENERIC = new Set(["owner", "admin", "administrator", "demo", "client", "team", "collaborator", "user", "aps", "ltd", "gmbh", "inc"]);

/**
 * Replaces company and person names with a neutral placeholder (case-insensitive,
 * whole words). Used before text from one client is shown to the model while it
 * works on another, and on every case-book entry.
 */
export function scrubNames(text: string, names: string[], exact: string[] = []): string {
  let out = text;
  const parts = new Set<string>();
  for (const name of names) {
    const full = name.replace(/\(demo[^)]*\)/gi, "").replace(/\s+/g, " ").trim();
    if (full.length >= 3) parts.add(full);
    // Also each distinctive word (first name, surname, "Nordic"), unless it is ordinary vocabulary.
    for (const word of full.split(/[^\p{L}\p{N}]+/u)) {
      if (word.length >= 4 && !GENERIC.has(word.toLowerCase())) parts.add(word);
    }
  }
  // Phrases removed only as a whole (a project title): their single words are normal vocabulary.
  for (const phrase of exact) if (phrase.trim().length >= 3) parts.add(phrase.trim());
  // Longest first, so "Nordic Polymers ApS" goes before "Nordic".
  for (const p of [...parts].sort((a, b) => b.length - a.length)) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu"), "[client]");
  }
  return out;
}

const STOP = new Set(
  "the a an and or of to in on for with is are was were be been it this that we you your our at as by from not but have has had will can could should would do does did if then than so what when which who how why into over under about after before between more most some any all new".split(" ")
);
const words = (text: string) =>
  new Set((text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,}/gu) ?? []).filter((w) => !STOP.has(w)));

/** The cases most similar to a query, by shared words (tags count double). Zero overlap is dropped. */
export function rankCases(query: string, cases: CaseStudy[], limit = 2): CaseStudy[] {
  const q = words(query);
  if (!q.size) return [];
  return cases
    .map((c) => {
      const body = words(`${c.title} ${c.problem} ${c.findings} ${c.outcome}`);
      const tags = words(c.tags.join(" "));
      let score = 0;
      for (const w of q) {
        if (body.has(w)) score += 1;
        if (tags.has(w)) score += 2;
      }
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

/** Axel's recent corrections as tone examples (names scrubbed, shortened). Skips drafts he sent unchanged. */
export function formatExamples(examples: Example[], names: string[], limit = 4): string {
  const useful = examples
    .filter((e) => e.final.trim() && e.final.trim() !== e.draft.trim())
    .slice(0, limit)
    .map(
      (e, i) =>
        `Example ${i + 1}\nAI draft: ${clip(scrubNames(e.draft, names), 500)}\nWhat Axel actually sent: ${clip(scrubNames(e.final, names), 500)}`
    );
  return useful.length ? useful.join("\n\n") : "";
}

export function formatCases(cases: CaseStudy[]): string {
  return cases
    .map(
      (c, i) =>
        `Case ${i + 1}: ${c.title}\nProblem: ${clip(c.problem, 400)}\nFindings: ${clip(c.findings, 500)}\nOutcome: ${clip(c.outcome, 300)}`
    )
    .join("\n\n");
}

export type CaseDraft = { title: string; problem: string; findings: string; outcome: string; tags: string[] };

/** Reads the model's JSON reply for a case write-up, tolerating code fences and extra prose. */
export function parseCaseDraft(raw: string): CaseDraft | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const j = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const tags = Array.isArray(j.tags) ? j.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean).slice(0, 8) : [];
    const title = str(j.title);
    if (!title) return null;
    return { title: title.slice(0, 160), problem: str(j.problem), findings: str(j.findings), outcome: str(j.outcome), tags };
  } catch {
    return null;
  }
}
