"use server";

import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AiUnavailableError, aiConfigured, aiModel, chat } from "@/lib/ai/provider";
import { buildProjectContext } from "@/lib/ai/context";
import { stripCitations } from "@/lib/ai/format";
import { draftSystem } from "@/lib/ai/prompts";
import { formatCases, formatExamples, rankCases, type CaseStudy } from "@/lib/ai/learning";

export type DraftResult = { ok: true; draft: string } | { ok: false; message: string };


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

  // What the copilot has learned from Axel: his rules, his recent corrections and similar past cases.
  const [{ data: rules }, { data: pairs }, { data: caseRows }, { data: orgs }, { data: people }] = await Promise.all([
    supabase.from("ai_rules").select("body").eq("id", 1).maybeSingle(),
    supabase
      .from("ai_interactions")
      .select("answer, final_text")
      .eq("kind", "draft")
      .not("final_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("case_studies").select("id, title, problem, findings, outcome, tags").order("created_at", { ascending: false }).limit(200),
    supabase.from("organizations").select("name"),
    supabase.rpc("thread_participants", { p_project: projectId }),
  ]);
  // Names are scrubbed from other conversations' examples before the model sees them.
  const names = [
    ...(orgs ?? []).map((o) => o.name as string),
    ...((people ?? []) as { name: string; is_admin: boolean }[]).filter((p) => !p.is_admin).map((p) => p.name),
  ];
  const examples = formatExamples(
    (pairs ?? []).map((p) => ({ draft: p.answer as string, final: p.final_text as string })),
    names
  );
  const similar = rankCases(`${context.projectName} ${last.body}`, (caseRows ?? []) as CaseStudy[], 2);

  try {
    const raw = await chat({
      messages: [
        { role: "system", content: draftSystem({ rules: (rules?.body as string) ?? "", examples, cases: formatCases(similar) }) },
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
