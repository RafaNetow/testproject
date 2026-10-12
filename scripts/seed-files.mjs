// Uploads real sample files for the demo workspace into the LOCAL Supabase and
// attaches them to deliverables and a board card. Run by `npm run db:start` and
// `npm run db:reset` after seed.sql; safe to run again (files already present
// are skipped). Storage needs actual blobs, which SQL can't create.
// Same detector the app uses on upload (Node runs the .ts file directly).
import { detectTechnique } from "../src/lib/techniques.ts";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const ADMIN = "00000000-0000-0000-0000-0000000000a1";
const OWNER = "00000000-0000-0000-0000-0000000000c1";
const P1 = "20000000-0000-0000-0000-000000000001";
const P2 = "20000000-0000-0000-0000-000000000002";
const BUCKET = "project-files";

function localStatus() {
  try {
    const raw = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return JSON.parse(raw.slice(raw.indexOf("{")));
  } catch {
    console.error("Local Supabase isn't running. Start Docker Desktop, then run: npm run db:start");
    process.exit(1);
  }
}

const status = localStatus();
const url = status.API_URL;
const key = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url ?? "")) {
  console.error(`Refusing to run: Supabase URL is not local (${url}).`);
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// ---- sample content ------------------------------------------------------

function csv(headers, rows) {
  return Buffer.from([headers.join(","), ...rows.map((r) => r.join(","))].join("\n") + "\n");
}

function pdf(title, lines) {
  const esc = (s) => s.replace(/[\\()]/g, (m) => `\\${m}`);
  const content = [
    "BT",
    "/F1 18 Tf",
    "72 780 Td",
    `(${esc(title)}) Tj`,
    "/F1 11 Tf",
    ...lines.flatMap((l) => ["0 -24 Td", `(${esc(l)}) Tj`]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const text = (s) => Buffer.from(s + "\n");

const FILES = [
  {
    key: "formulation",
    project: P1,
    folder: "Formulation Data",
    name: "BA-200-formulation-records.csv",
    mime: "text/csv",
    by: OWNER,
    body: csv(
      ["batch", "resin_pct", "crosslinker_pct", "plasticiser_pct", "cure_temp_c", "outcome"],
      [
        ["BA-200-05", 61.0, 8.0, 12.0, 80, "pass"],
        ["BA-200-07", 59.5, 8.0, 14.5, 80, "bond failure"],
        ["BA-200-09", 60.0, 8.0, 14.0, 85, "bond failure"],
        ["BA-200-12", 59.0, 7.5, 15.0, 85, "bond failure"],
        ["BA-200-13", 61.0, 8.0, 12.0, 80, "pass"],
      ]
    ),
  },
  {
    key: "ftir",
    project: P1,
    folder: "Characterisation Results",
    name: "FTIR-batches-07-09-12.csv",
    mime: "text/csv",
    by: ADMIN,
    body: csv(
      ["wavenumber_cm-1", "batch_05_abs", "batch_07_abs", "batch_09_abs", "batch_12_abs"],
      [
        [1740, 0.42, 0.61, 0.58, 0.64],
        [1725, 0.18, 0.39, 0.37, 0.43],
        [1160, 0.51, 0.50, 0.52, 0.49],
        [1040, 0.33, 0.34, 0.31, 0.35],
      ]
    ),
  },
  {
    key: "dsc",
    project: P1,
    folder: "Characterisation Results",
    name: "DSC-thermograms-summary.csv",
    mime: "text/csv",
    by: ADMIN,
    body: csv(
      ["batch", "tg_onset_c", "tg_midpoint_c", "delta_cp_j_g_k"],
      [
        ["BA-200-05", 41.2, 44.0, 0.31],
        ["BA-200-07", 35.1, 38.2, 0.36],
        ["BA-200-09", 35.8, 38.9, 0.35],
        ["BA-200-12", 34.7, 37.6, 0.37],
      ]
    ),
  },
  {
    key: "rootcause",
    project: P1,
    folder: "Reports",
    name: "Root-cause-report-v2.pdf",
    mime: "application/pdf",
    by: ADMIN,
    body: pdf("Root-cause report: bond failures", [
      "Finding 1: a migrating plasticiser lowers Tg by about 6 C in failed batches.",
      "Finding 2: FTIR shows an extra carbonyl band near 1740 cm-1 in batches 07, 09, 12.",
      "Finding 3: failures cluster where plasticiser exceeds 14 percent.",
      "Confidence: high for findings 1 and 2, medium for finding 3.",
      "Recommendation: cap plasticiser at 12 percent and re-test at 7 and 14 days.",
    ]),
  },
  {
    key: "cure",
    project: P1,
    folder: "Reports",
    name: "Cure-schedule-proposal-v1.pdf",
    mime: "application/pdf",
    by: ADMIN,
    body: pdf("Cure-schedule revision proposal", [
      "Proposal: two-stage cure, 70 C for 40 minutes then 85 C for 20 minutes.",
      "Expected effect: lower residual monomer and a tighter Tg distribution.",
      "Risk: longer line time; validate on two trial batches first.",
    ]),
  },
  {
    key: "datapackage",
    project: P1,
    folder: "Reports",
    name: "Data-package-batches-07-09-12.pdf",
    mime: "application/pdf",
    by: ADMIN,
    body: pdf("Data package: batches 07, 09 and 12", [
      "Contents: formulation records, FTIR spectra and DSC thermograms for three failed batches.",
      "All values cross-referenced against the batch records supplied on kick-off.",
    ]),
  },
  {
    key: "literature",
    project: P1,
    folder: "Reference Materials",
    name: "Plasticiser-literature-notes.txt",
    mime: "text/plain",
    by: ADMIN,
    body: text(
      "Plasticiser migration in bio-based adhesives: reading notes\n\n" +
        "- Migration rate rises sharply above roughly 14 percent loading.\n" +
        "- Storage above 30 C accelerates movement to the bond line.\n" +
        "- Tg depression is the earliest measurable symptom."
    ),
  },
  {
    key: "ovenlogs",
    project: P2,
    folder: "Formulation Data",
    name: "Cure-oven-logs-run-01-10.csv",
    mime: "text/csv",
    by: OWNER,
    body: csv(
      ["run", "setpoint_c", "peak_c", "dwell_min", "water_uptake_pct"],
      [
        ["01", 80, 82, 60, 3.1],
        ["02", 80, 84, 60, 3.4],
        ["03", 80, 79, 55, 5.2],
        ["04", 85, 86, 60, 2.9],
        ["05", 80, 78, 50, 5.8],
      ]
    ),
  },
  {
    key: "nmr",
    project: P2,
    folder: "Characterisation Results",
    name: "NMR-residual-monomer-summary.csv",
    mime: "text/csv",
    by: ADMIN,
    body: csv(
      ["batch", "residual_monomer_pct", "conversion_pct"],
      [
        ["CT-40-03", 4.8, 95.2],
        ["CT-40-05", 5.6, 94.4],
        ["CT-40-08", 1.2, 98.8],
      ]
    ),
  },
  {
    key: "nmrreport",
    project: P2,
    folder: "Reports",
    name: "NMR-findings-report-v1.pdf",
    mime: "application/pdf",
    by: ADMIN,
    body: pdf("NMR findings: unreacted monomer", [
      "Batches with the worst water resistance carry 4.8 to 5.6 percent residual monomer.",
      "The good batch carries 1.2 percent.",
      "Residual monomer tracks with short dwell time and low peak oven temperature.",
    ]),
  },
];

// Which files each deliverable carries, by deliverable id.
const ATTACH = {
  "50000000-0000-0000-0000-000000000001": ["datapackage", "formulation", "ftir"],
  "50000000-0000-0000-0000-000000000002": ["rootcause", "ftir", "dsc"],
  "50000000-0000-0000-0000-000000000003": ["cure"],
  "50000000-0000-0000-0000-000000000004": ["literature"],
  "50000000-0000-0000-0000-000000000006": ["rootcause"], // draft: must stay hidden from the client
  "50000000-0000-0000-0000-000000000011": ["nmrreport", "nmr"],
};

// ---- run -----------------------------------------------------------------

async function waitForStorage() {
  for (let i = 0; i < 40; i++) {
    const { error } = await supabase.storage.listBuckets();
    if (!error) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.error("Storage didn't become ready in time.");
  process.exit(1);
}

await waitForStorage();

const { data: projects } = await supabase.from("projects").select("id").in("id", [P1, P2]);
if (!projects?.length) {
  console.log("Demo projects not found — skipping file seeding (run seed first).");
  process.exit(0);
}

const folderIds = new Map();
{
  const { data: folders } = await supabase.from("folders").select("id, project_id, name").in("project_id", [P1, P2]);
  for (const f of folders ?? []) folderIds.set(`${f.project_id}|${f.name}`, f.id);
}

const fileIds = new Map();
let created = 0;

for (const f of FILES) {
  const storagePath = `${f.project}/demo-${f.name}`;

  const { data: existing } = await supabase.from("files").select("id").eq("storage_path", storagePath).maybeSingle();
  if (existing) {
    fileIds.set(f.key, existing.id);
    continue;
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, f.body, { contentType: f.mime, upsert: true });
  if (uploadError) {
    console.error(`Upload failed for ${f.name}: ${uploadError.message}`);
    process.exit(1);
  }

  const { data: row, error } = await supabase
    .from("files")
    .insert({
      project_id: f.project,
      folder_id: folderIds.get(`${f.project}|${f.folder}`) ?? null,
      storage_path: storagePath,
      filename: f.name,
      size_bytes: f.body.length,
      mime_type: f.mime,
      uploaded_by: f.by,
      technique: detectTechnique(f.name),
    })
    .select("id")
    .single();
  if (error) {
    console.error(`Couldn't record ${f.name}: ${error.message}`);
    process.exit(1);
  }
  fileIds.set(f.key, row.id);
  created++;
}

const links = Object.entries(ATTACH).flatMap(([deliverableId, keys]) =>
  keys.map((k) => ({ deliverable_id: deliverableId, file_id: fileIds.get(k) })).filter((l) => l.file_id)
);
if (links.length) {
  const { error } = await supabase.from("deliverable_files").upsert(links, { onConflict: "deliverable_id,file_id" });
  if (error) {
    console.error(`Couldn't attach files to deliverables: ${error.message}`);
    process.exit(1);
  }
}

// One file on a board card too, so card attachments have something to show.
if (fileIds.get("formulation")) {
  await supabase
    .from("board_card_files")
    .upsert({ card_id: "40000000-0000-0000-0000-000000000002", file_id: fileIds.get("formulation") }, { onConflict: "card_id,file_id" });
}

console.log(`Demo files ready (${created} uploaded, ${FILES.length - created} already present).`);
