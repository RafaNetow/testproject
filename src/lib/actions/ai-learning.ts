"use server";

import { revalidatePath } from "next/cache";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AiUnavailableError, aiConfigured, chat } from "@/lib/ai/provider";
import { buildProjectContext } from "@/lib/ai/context";
import { CASE_SYSTEM } from "@/lib/ai/prompts";
import { parseCaseDraft, scrubNames, type CaseDraft } from "@/lib/ai/learning";

export type LearnResult = { ok: boolean; message?: string };
export type CaseDraftResult = { ok: true; draft: CaseDraft; projectId: string } | { ok: false; message: string };

const MAX_RULES = 6000;

/** Axel's written rules: the copilot reads them every time it drafts a reply. */
export async function saveRules(_prev: LearnResult | null, formData: FormData): Promise<LearnResult> {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length > MAX_RULES) return { ok: false, message: `Keep the rules under ${MAX_RULES} characters.` };

  const supabase = await createClient();
  const { error } = await supabase.from("ai_rules").update({ body, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  revalidatePath("/admin/assistant");
  return { ok: true, message: "Saved. The copilot will follow these from the next draft." };
}

/**
 * Drafts an anonymised case-book entry from a project. Nothing is saved: Axel
 * reads and edits it first. Company, project and people's names are removed
 * from the result even if the model leaves one in.
 */
export async function generateCaseDraft(projectId: string): Promise<CaseDraftResult> {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  if (!aiConfigured()) return { ok: false, message: "AI is not configured — add the AI_* keys to .env.local." };

  const supabase = await createClient();
  const context = await buildProjectContext(supabase, projectId, { surface: "admin", userId: user.id });
  if (!context) return { ok: false, message: "Project not found." };

  const [{ data: orgs }, { data: people }] = await Promise.all([
    supabase.from("organizations").select("name"),
    supabase.rpc("thread_participants", { p_project: projectId }),
  ]);
  // Client side only: Axel's own name stays; the project title goes as a whole phrase.
  const names = [
    ...(orgs ?? []).map((o) => o.name as string),
    ...((people ?? []) as { name: string; is_admin: boolean }[]).filter((p) => !p.is_admin).map((p) => p.name),
  ];
  const exact = [context.projectName];

  try {
    const raw = await chat({
      messages: [
        { role: "system", content: CASE_SYSTEM },
        { role: "user", content: `${scrubNames(context.text, names, exact)}\n\nWrite the case-book entry as JSON.` },
      ],
      maxTokens: 700,
    });
    const parsed = parseCaseDraft(raw);
    if (!parsed) return { ok: false, message: "The assistant's reply couldn't be read. Please try again." };
    const clean = (t: string) => scrubNames(t, names, exact);
    return {
      ok: true,
      projectId,
      draft: { title: clean(parsed.title), problem: clean(parsed.problem), findings: clean(parsed.findings), outcome: clean(parsed.outcome), tags: parsed.tags.map(clean) },
    };
  } catch (err) {
    return { ok: false, message: err instanceof AiUnavailableError ? err.message : "Couldn't draft the case right now." };
  }
}

/** Saves a case Axel has reviewed. */
export async function saveCase(_prev: LearnResult | null, formData: FormData): Promise<LearnResult> {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "Give the case a title." };
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
  const source = String(formData.get("source_project_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("case_studies").insert({
    title: title.slice(0, 160),
    problem: String(formData.get("problem") ?? "").trim(),
    findings: String(formData.get("findings") ?? "").trim(),
    outcome: String(formData.get("outcome") ?? "").trim(),
    tags,
    source_project_id: source || null,
    created_by: user.id,
  });
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  revalidatePath("/admin/assistant");
  return { ok: true, message: "Added to the case book." };
}

export async function deleteCase(id: string) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) throw new Error(`Couldn't delete the case: ${error.message}`);
  revalidatePath("/admin/assistant");
}
