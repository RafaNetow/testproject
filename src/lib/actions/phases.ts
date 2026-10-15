"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity, quoted } from "@/lib/activity";

type Phase = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
};

const DATE_RE = /^d{4}-d{2}-d{2}$/;

/** "" clears the date; anything else must be YYYY-MM-DD. */
function readDate(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  if (!DATE_RE.test(raw)) throw new Error("Dates must be valid calendar dates.");
  return raw;
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

async function getPhase(phaseId: string): Promise<Phase> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_phases")
    .select("id, project_id, name, position, progress_pct, start_date, end_date")
    .eq("id", phaseId)
    .maybeSingle();
  if (!data) throw new Error("Stage not found.");
  return data as Phase;
}

/** The admin edits stages on the client page; the client reads them on their summary. */
async function revalidatePhases(projectId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("org_id").eq("id", projectId).maybeSingle();
  if (project?.org_id) revalidatePath(`/admin/clients/${project.org_id}`);
  revalidatePath("/portal");
}

function readName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Give the stage a name.");
  if (name.length > 80) throw new Error("Keep the stage name under 80 characters.");
  return name;
}

function readPct(formData: FormData) {
  const pct = Math.round(Number(formData.get("progress_pct")));
  return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : null;
}

export async function addPhase(projectId: string, formData: FormData) {
  await requireAxelAdmin();
  const name = readName(formData);

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("project_phases")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("project_phases")
    .insert({ project_id: projectId, name, position: (last?.position ?? -1) + 1 });
  if (error) throw new Error(`Couldn't add the stage: ${error.message}`);

  await recordActivity({ kind: "project", projectId, message: `added the stage ${quoted(name)}` });
  await revalidatePhases(projectId);
}

/** Saves a stage's name and/or percentage — only what the form sends, and only if it changed. */
export async function updatePhase(phaseId: string, formData: FormData) {
  await requireAxelAdmin();
  const current = await getPhase(phaseId);

  const update: Partial<Pick<Phase, "name" | "progress_pct" | "start_date" | "end_date">> = {};
  if (formData.has("name")) {
    const name = readName(formData);
    if (name !== current.name) update.name = name;
  }
  if (formData.has("progress_pct")) {
    const pct = readPct(formData);
    if (pct !== null && pct !== current.progress_pct) update.progress_pct = pct;
  }
  for (const key of ["start_date", "end_date"] as const) {
    if (formData.has(key)) {
      const date = readDate(formData, key);
      if (date !== current[key]) update[key] = date;
    }
  }
  const start = update.start_date !== undefined ? update.start_date : current.start_date;
  const end = update.end_date !== undefined ? update.end_date : current.end_date;
  if (start && end && end < start) throw new Error("A stage can't end before it starts.");
  if (Object.keys(update).length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_phases")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", phaseId);
  if (error) throw new Error(`Couldn't save the stage: ${error.message}`);

  const name = update.name ?? current.name;
  const datesChanged = update.start_date !== undefined || update.end_date !== undefined;
  const message =
    update.progress_pct !== undefined
      ? update.progress_pct === 100
        ? `completed the stage ${quoted(name)}`
        : `updated ${quoted(name)} to ${update.progress_pct}%`
      : datesChanged
        ? start && end
          ? `scheduled ${quoted(name)} for ${shortDate(start)} – ${shortDate(end)}`
          : `updated the dates of ${quoted(name)}`
        : `renamed the stage ${quoted(current.name)} to ${quoted(name)}`;
  await recordActivity({ kind: "project", projectId: current.project_id, message });
  await revalidatePhases(current.project_id);
}

/** Swaps a stage with its neighbour; the order is what the client reads as the timeline. */
export async function movePhase(phaseId: string, direction: "up" | "down") {
  await requireAxelAdmin();
  const current = await getPhase(phaseId);

  const supabase = await createClient();
  const { data: neighbour } = await supabase
    .from("project_phases")
    .select("id, position")
    .eq("project_id", current.project_id)
    [direction === "up" ? "lt" : "gt"]("position", current.position)
    .order("position", { ascending: direction === "down" })
    .limit(1)
    .maybeSingle();
  if (!neighbour) return;

  const now = new Date().toISOString();
  const [a, b] = await Promise.all([
    supabase.from("project_phases").update({ position: neighbour.position, updated_at: now }).eq("id", current.id),
    supabase.from("project_phases").update({ position: current.position, updated_at: now }).eq("id", neighbour.id),
  ]);
  const failed = a.error ?? b.error;
  if (failed) throw new Error(`Couldn't reorder the stages: ${failed.message}`);

  await revalidatePhases(current.project_id);
}

export async function deletePhase(phaseId: string) {
  await requireAxelAdmin();
  const current = await getPhase(phaseId);

  const supabase = await createClient();
  const { error } = await supabase.from("project_phases").delete().eq("id", phaseId);
  if (error) throw new Error(`Couldn't delete the stage: ${error.message}`);

  await recordActivity({ kind: "project", projectId: current.project_id, message: `removed the stage ${quoted(current.name)}` });
  await revalidatePhases(current.project_id);
}
