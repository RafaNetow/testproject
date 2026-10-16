"use server";

import { revalidatePath } from "next/cache";
import { isAxelAdmin, requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activity";
import { AiUnavailableError, aiConfigured, aiModel, chat } from "@/lib/ai/provider";
import { buildProjectContext } from "@/lib/ai/context";
import { citedSources, stripCitations, type Source } from "@/lib/ai/format";
import { CLIENT_SYSTEM, DRAFT_SYSTEM } from "@/lib/ai/prompts";

export type AskResult = { ok: true; answer: string; sources: Source[] } | { ok: false; message: string };
export type DraftResult = { ok: true; draft: string } | { ok: false; message: string };

const MAX_QUESTION = 1000;

/** Client (or admin) asks the assistant about one project. Read-only; answers only from that project's data. */
export async function askAlchemica(projectId: string, question: string): Promise<AskResult> {
  const user = await requireSessionUser();
  const q = question.trim();
  if (!q) return { ok: false, message: "Type a question first." };
  if (q.length > MAX_QUESTION) return { ok: false, message: `Keep questions under ${MAX_QUESTION} characters.` };
  if (!aiConfigured()) return { ok: false, message: "The assistant isn't available yet." };

  const supabase = await createClient();
  const admin = await isAxelAdmin();
  // Everything below runs as the signed-in user: RLS decides what they can see.
  const context = await buildProjectContext(supabase, projectId, { surface: admin ? "admin" : "portal", userId: user.id });
  if (!context) return { ok: false, message: "We couldn't find that project." };

  const { data: org } = await supabase.from("organizations").select("ai_enabled").eq("id", context.orgId).maybeSingle();
  if (!org?.ai_enabled) return { ok: false, message: "The assistant isn't switched on for your workspace." };

  const { data: allowed } = await supabase.rpc("ai_rate_ok");
  if (allowed === false) return { ok: false, message: "You've asked a lot of questions this hour — please try again later, or ask Axel." };

  try {
    const raw = await chat({
      messages: [
        { role: "system", content: CLIENT_SYSTEM },
        { role: "user", content: `${context.text}\n\nQUESTION: ${q}` },
      ],
    });
    const sources = citedSources(raw, context.sources);
    const answer = stripCitations(raw);
    await supabase.from("ai_interactions").insert({
      org_id: context.orgId,
      project_id: projectId,
      user_id: user.id,
      kind: "ask",
      question: q,
      answer,
      sources,
      model: aiModel(),
    });
    return { ok: true, answer, sources };
  } catch (err) {
    return { ok: false, message: err instanceof AiUnavailableError ? err.message : "The assistant couldn't answer right now." };
  }
}

/** Admin: a draft reply to the client's latest message. Never sent automatically. */
export async function suggestReply(projectId: string): Promise<DraftResult> {
  await requireAxelAdmin();
  const user = await requireSessionUser();
  if (!aiConfigured()) return { ok: false, message: "AI is not configured — add the AI_* keys to .env.local." };

  const supabase = await createClient();
  const context = await buildProjectContext(supabase, projectId, { surface: "admin", userId: user.id });
  if (!context) return { ok: false, message: "Project not found." };

  const { data: last } = await supabase
    .from("messages")
    .select("body")
    .eq("project_id", projectId)
    .neq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return { ok: false, message: "There's no client message to reply to yet." };

  try {
    const raw = await chat({
      messages: [
        { role: "system", content: DRAFT_SYSTEM },
        { role: "user", content: `${context.text}\n\nCLIENT'S LATEST MESSAGE: ${last.body}\n\nDraft Axel's reply.` },
      ],
      maxTokens: 400,
    });
    const draft = stripCitations(raw);
    await supabase.from("ai_interactions").insert({
      org_id: context.orgId,
      project_id: projectId,
      user_id: user.id,
      kind: "draft",
      question: last.body.slice(0, 2000),
      answer: draft,
      model: aiModel(),
    });
    return { ok: true, draft };
  } catch (err) {
    return { ok: false, message: err instanceof AiUnavailableError ? err.message : "Couldn't draft a reply right now." };
  }
}

/** Admin: switch the assistant on or off for one client organisation. */
export async function setOrgAi(orgId: string, enabled: boolean) {
  await requireAxelAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ ai_enabled: enabled }).eq("id", orgId);
  if (error) throw new Error(`Couldn't update the AI setting: ${error.message}`);
  await recordActivity({ kind: "client", orgId, message: `${enabled ? "enabled" : "disabled"} the AI assistant`, adminsOnly: true });
  revalidatePath(`/admin/clients/${orgId}`);
  revalidatePath("/portal", "layout");
}
