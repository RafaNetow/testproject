"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function logDecision(projectId: string, paths: string[], formData: FormData) {
  const user = await requireSessionUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new Error("Decision title is required.");
  }
  const body = String(formData.get("body") ?? "").trim();
  const decidedAt = String(formData.get("decided_at") ?? "").trim();
  const participantsRaw = String(formData.get("participants") ?? "").trim();

  const supabase = await createClient();
  const { data: decision, error } = await supabase
    .from("decisions")
    .insert({
      project_id: projectId,
      title,
      body: body || null,
      source_type: "manual",
      decided_at: decidedAt ? new Date(decidedAt).toISOString() : new Date().toISOString(),
      logged_by: user.id,
    })
    .select("id")
    .single();
  if (error || !decision) {
    throw new Error(`Couldn't log decision: ${error?.message ?? "unknown error"}`);
  }

  const names = participantsRaw
    ? participantsRaw.split(",").map((n) => n.trim()).filter(Boolean)
    : [];
  if (names.length) {
    const { error: participantsError } = await supabase
      .from("decision_participants")
      .insert(names.map((name) => ({ decision_id: decision.id, participant_name: name })));
    if (participantsError) {
      throw new Error(
        `Decision logged, but couldn't save participants: ${participantsError.message}`
      );
    }
  }

  revalidateAll(paths);
}

export async function deleteDecision(decisionId: string, paths: string[]) {
  await requireSessionUser();
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").delete().eq("id", decisionId);
  if (error) {
    throw new Error(`Couldn't delete decision: ${error.message}`);
  }
  revalidateAll(paths);
}
