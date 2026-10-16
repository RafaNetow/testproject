import { describe, expect, it } from "vitest";
import { citedSources, formatContext, stripCitations, type ProjectData } from "./format";

const data: ProjectData = {
  name: "Water-resistant coating",
  status: "active",
  progressPct: 53,
  phases: [
    { name: "Onboarding", progress_pct: 100, start_date: "2026-10-03", end_date: "2026-10-06", description: null },
    { name: "Preliminary experiments", progress_pct: 60, start_date: "2026-10-07", end_date: "2026-10-20", description: "We test three cure temperatures." },
  ],
  decisions: [{ title: "Keep the cure at 140 °C", body: "Until the oven logs are in.", decided_at: "2026-10-15T10:00:00Z" }],
  deliverables: [{ title: "NMR findings", status: "in_review", due_date: "2026-10-13" }],
  requests: [{ title: "Cure-oven logs", status: "requested", due_date: "2026-10-19" }],
  waiting: ["NMR findings"],
  messages: [{ author: "Maja Owner", body: "Should we pause the line trials?", created_at: "2026-10-13T09:00:00Z" }],
};

const href = (kind: string) => `/portal/${kind}`;

describe("formatContext", () => {
  const { text, sources } = formatContext(data, "2026-10-16", href);

  it("gives every item a citable id and a link", () => {
    expect(sources.map((s) => s.id)).toEqual(["s1", "s2", "d1", "v1", "r1"]);
    expect(sources.find((s) => s.id === "d1")).toMatchObject({ kind: "decision", title: "Keep the cure at 140 °C", href: "/portal/decision" });
    expect(text).toContain("[s2] Preliminary experiments — 60%");
  });

  it("includes the on-time status and stage description", () => {
    expect(text).toContain("On track");
    expect(text).toContain("What happens: We test three cure temperatures.");
  });

  it("wraps everything as data, with names but no email addresses", () => {
    expect(text.startsWith("PROJECT DATA")).toBe(true);
    expect(text).toContain("END OF PROJECT DATA");
    expect(text).toContain("Maja Owner:");
    expect(text).not.toMatch(/@/);
  });
});

describe("citations", () => {
  const { sources } = formatContext(data, "2026-10-16", href);

  it("returns only the sources the answer cites, once each, in order", () => {
    const cited = citedSources("Stage two is on track [s2]. You agreed to keep 140 °C [d1][s2]. Unknown [x9].", sources);
    expect(cited.map((s) => s.id)).toEqual(["s2", "d1"]);
  });

  it("strips the markers for display", () => {
    expect(stripCitations("On track [s2]. Agreed [d1].")).toBe("On track. Agreed.");
  });
});
