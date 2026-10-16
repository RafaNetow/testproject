import { describe, expect, it } from "vitest";
import { formatExamples, parseCaseDraft, rankCases, scrubNames, type CaseStudy } from "./learning";

describe("scrubNames", () => {
  it("removes company and person names, longest first, whole words only", () => {
    const text = "Maja Owner at Nordic Polymers ApS (demo) asked Axel about nordic grades. Majanta is unrelated.";
    const out = scrubNames(text, ["Nordic Polymers ApS (demo)", "Maja Owner"]);
    expect(out).not.toMatch(/Maja Owner|Nordic Polymers|nordic/i);
    expect(out).toContain("Majanta"); // not a whole-word match
    expect(out).toContain("[client]");
  });

  it("removes a project title only as a whole phrase, keeping ordinary words", () => {
    const text = "In 'Water-resistant coating: cure schedule' the cure was too short; under-cure left monomer.";
    const out = scrubNames(text, [], ["Water-resistant coating: cure schedule"]);
    expect(out).toContain("[client]");
    expect(out).toContain("the cure was too short");
    expect(out).toContain("under-cure");
  });

  it("does not scrub generic words that happen to be part of a name", () => {
    const out = scrubNames("The workspace owner is the admin of the team.", ["Maja Owner", "Axel (demo admin)"]);
    expect(out).toBe("The workspace owner is the admin of the team.");
  });

  it("leaves text alone when there are no usable names", () => {
    expect(scrubNames("Cure at 140 C", ["", "ab"])).toBe("Cure at 140 C");
  });
});

const cases: CaseStudy[] = [
  { id: "1", title: "Adhesion failure from moisture", problem: "Bio-based adhesive bonds failed after storage.", findings: "FTIR showed water uptake in the plasticiser lot.", outcome: "Dry the lot below 0.1% before mixing.", tags: ["adhesive", "moisture"] },
  { id: "2", title: "Coating under-cure", problem: "Water-resistant coating absorbed water.", findings: "NMR found unreacted monomer; oven dwell time too short.", outcome: "Raised cure temperature and dwell time.", tags: ["coating", "cure"] },
  { id: "3", title: "Polymer blend colour drift", problem: "Colour varied between batches.", findings: "Pigment dispersion differed.", outcome: "Standardised mixing order.", tags: ["colour"] },
];

describe("rankCases", () => {
  it("returns the most similar cases first and drops unrelated ones", () => {
    const hits = rankCases("our coating absorbs water, could the cure be too short?", cases, 2);
    expect(hits.map((c) => c.id)).toEqual(["2", "1"]);
    expect(rankCases("invoice payment terms", cases)).toEqual([]);
  });

  it("gives tag matches extra weight", () => {
    expect(rankCases("moisture", cases, 1)[0].id).toBe("1");
  });
});

describe("formatExamples", () => {
  it("keeps only drafts Axel changed, with names scrubbed", () => {
    const text = formatExamples(
      [
        { draft: "Hi Maja, thanks for the logs.", final: "Maja, got the logs. Keeping 140 C until runs 21-22 arrive." },
        { draft: "Same", final: "Same" },
      ],
      ["Maja Owner"]
    );
    expect(text).toContain("Example 1");
    expect(text).not.toContain("Example 2");
    expect(text).not.toMatch(/Maja/);
  });

  it("is empty with no useful corrections", () => {
    expect(formatExamples([], [])).toBe("");
  });
});

describe("parseCaseDraft", () => {
  it("reads JSON wrapped in fences or prose", () => {
    const draft = parseCaseDraft('Here you go:\n```json\n{"title":"Under-cure","problem":"p","findings":"f","outcome":"o","tags":["coating"," cure ",1]}\n```');
    expect(draft).toEqual({ title: "Under-cure", problem: "p", findings: "f", outcome: "o", tags: ["coating", "cure"] });
  });

  it("returns null for unusable replies", () => {
    expect(parseCaseDraft("no json here")).toBeNull();
    expect(parseCaseDraft('{"problem":"x"}')).toBeNull();
  });
});
