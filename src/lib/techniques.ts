/**
 * What a project file *is*, in the client's terms: the analytical technique
 * that produced it (NMR, FTIR…) or the kind of document (formulation records,
 * process logs, reports, literature). Detected from the filename on upload,
 * correctable by the admin. Keep in sync with migration 0018's backfill.
 */
export const TECHNIQUES = ["NMR", "FTIR", "DSC", "TGA", "GC-MS", "HPLC", "XRD", "SEM", "DMA", "Rheology"] as const;
export const FILE_KINDS = ["Formulation", "Process log", "Report", "Literature"] as const;
export const FILE_LABELS: readonly string[] = [...TECHNIQUES, ...FILE_KINDS];

export type FileLabel = (typeof TECHNIQUES)[number] | (typeof FILE_KINDS)[number];

// Ordered: analytical techniques win over document kinds ("NMR-findings-report" is NMR).
const RULES: [FileLabel, RegExp][] = [
  ["NMR", /\b(1h-?|13c-?)?nmr\b/i],
  ["FTIR", /\b(ft-?ir|atr-?ir|infrared)\b/i],
  ["DSC", /\bdsc\b|\bthermograms?\b/i],
  ["TGA", /\btga\b|\bthermogravimetr/i],
  ["GC-MS", /\bgc-?ms\b/i],
  ["HPLC", /\bhplc\b/i],
  ["XRD", /\bxrd\b|\bx-?ray\b/i],
  ["SEM", /\bsem\b|\bmicrograph/i],
  ["DMA", /\bdma\b/i],
  ["Rheology", /\brheolog/i],
  ["Formulation", /\bformulations?\b|\brecipes?\b/i],
  ["Process log", /\blogs?\b|\bbatch-?records?\b|\bprocess\b/i],
  ["Report", /\breports?\b|\bproposal\b|\bfindings\b|\bdata-?package\b/i],
  ["Literature", /\bliterature\b|\bpapers?\b|\breferences?\b|\bnotes\b/i],
];

/** Best guess from a filename; separators (-, _, .) count as word breaks. */
export function detectTechnique(filename: string): FileLabel | null {
  const name = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[_.]+/g, " ");
  for (const [label, pattern] of RULES) {
    if (pattern.test(name)) return label;
  }
  return null;
}

export function isFileLabel(value: string): value is FileLabel {
  return FILE_LABELS.includes(value);
}

/** One plain sentence per label, for clients who don't read spectra. */
export const LABEL_HINTS: Record<FileLabel, string> = {
  NMR: "Nuclear magnetic resonance — confirms a molecule's structure.",
  FTIR: "Infrared spectroscopy — shows which chemical groups are present.",
  DSC: "Heat-flow measurement — melting, curing and softening temperatures.",
  TGA: "Weighs a sample while heating it — thermal stability and composition.",
  "GC-MS": "Separates and identifies volatile compounds, such as solvents or odours.",
  HPLC: "Separates and measures the components of a liquid mixture.",
  XRD: "X-ray diffraction — reveals whether and how a material is crystalline.",
  SEM: "Electron-microscope images of the surface, at very high magnification.",
  DMA: "Measures stiffness and damping as the temperature changes.",
  Rheology: "How the material flows, thickens or deforms under force.",
  Formulation: "Recipes: which ingredients, and how much of each.",
  "Process log": "Records of how each batch was made — temperatures, times, conditions.",
  Report: "Written findings and conclusions.",
  Literature: "Published papers and references behind the work.",
};
