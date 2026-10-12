import { describe, expect, it } from "vitest";
import { detectTechnique, isFileLabel } from "./techniques";

describe("detectTechnique", () => {
  it.each([
    ["FTIR-batches-07-09-12.csv", "FTIR"],
    ["DSC-thermograms-summary.csv", "DSC"],
    ["NMR-residual-monomer-summary.csv", "NMR"],
    ["TGA-run-3.csv", "TGA"],
    ["sample_gcms_trace.pdf", "GC-MS"],
    ["BA-200-formulation-records.csv", "Formulation"],
    ["Cure-oven-logs-run-01-10.csv", "Process log"],
    ["Root-cause-report-v2.pdf", "Report"],
    ["Data-package-batches-07-09-12.pdf", "Report"],
    ["Plasticiser-literature-notes.txt", "Literature"],
  ])("labels %s as %s", (filename, expected) => {
    expect(detectTechnique(filename)).toBe(expected);
  });

  it("prefers the analytical technique over the document kind", () => {
    expect(detectTechnique("NMR-findings-report-v1.pdf")).toBe("NMR");
  });

  it("returns null when nothing matches", () => {
    expect(detectTechnique("IMG_0042.jpg")).toBeNull();
  });

  it("does not match techniques inside other words", () => {
    expect(detectTechnique("seminar-agenda.pdf")).toBeNull();
  });
});

describe("isFileLabel", () => {
  it("accepts known labels only", () => {
    expect(isFileLabel("FTIR")).toBe(true);
    expect(isFileLabel("Process log")).toBe(true);
    expect(isFileLabel("Spectra")).toBe(false);
  });
});
