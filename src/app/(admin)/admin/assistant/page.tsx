import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/ai/provider";
import { AssistantRulesForm } from "@/components/admin/assistant-rules-form";
import { CaseBook } from "@/components/admin/case-book";
import { SectionHeader } from "@/components/shared/section-header";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** What the copilot has learned from Axel: his rules, his corrections and the case book. Admin only. */
export default async function AssistantPage() {
  await requireAxelAdmin();
  const supabase = await createClient();

  const [{ data: rules }, { data: pairs }, { data: cases }, { data: projects }, { count: drafts }] = await Promise.all([
    supabase.from("ai_rules").select("body").eq("id", 1).maybeSingle(),
    supabase
      .from("ai_interactions")
      .select("id, answer, final_text, created_at, projects(name)")
      .eq("kind", "draft")
      .not("final_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("case_studies").select("id, title, problem, findings, outcome, tags").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, organizations(name)").order("created_at", { ascending: false }),
    supabase.from("ai_interactions").select("id", { count: "exact", head: true }).eq("kind", "draft"),
  ]);

  const projectOptions = (projects ?? []).map((p) => ({
    id: p.id as string,
    label: `${(p.organizations as unknown as { name: string } | null)?.name ?? "Client"} · ${p.name}`,
  }));
  const changed = (pairs ?? []).filter((p) => p.final_text && p.final_text.trim() !== (p.answer as string).trim());

  return (
    <Stack spacing={5}>
      <SectionHeader
        eyebrow="Assistant"
        title="What the copilot has learned"
        subtitle="Only you see this. It shapes the drafts Suggest reply writes for you; clients never see it and the client assistant doesn't use it."
      />

      <Box component="section">
        <Typography variant="h2" sx={{ fontSize: 18, mb: 0.5 }}>
          Your rules
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", mb: 1.5 }}>How you want replies written. The copilot reads this every time.</Typography>
        <AssistantRulesForm initial={(rules?.body as string) ?? ""} />
      </Box>

      <Box component="section">
        <Typography variant="h2" sx={{ fontSize: 18, mb: 0.5 }}>
          Your corrections
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", mb: 1.5 }}>
          When you edit a draft and send it, the copilot keeps both versions and learns your tone from the differences.
          {" "}{drafts ?? 0} {drafts === 1 ? "draft" : "drafts"} so far, {changed.length} edited before sending.
        </Typography>
        {changed.length === 0 ? (
          <Typography sx={{ fontSize: 14, color: "text.muted" }}>
            Nothing yet. Use <b>Suggest reply</b> in a conversation, change the text and send it.
          </Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.5 }}>
            {changed.map((p) => (
              <Paper component="li" key={p.id} variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 12, color: "text.muted", mb: 1 }}>
                  {when(p.created_at)} · {(p.projects as unknown as { name: string } | null)?.name ?? "Project"}
                </Typography>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "1fr 1fr" } }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.muted" }}>AI draft</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13.5, whiteSpace: "pre-wrap" }}>{p.answer}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "primary.main" }}>What you sent</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13.5, whiteSpace: "pre-wrap" }}>{p.final_text}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Box component="section">
        <Typography variant="h2" sx={{ fontSize: 18, mb: 0.5 }}>
          Case book
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", mb: 1.5 }}>
          Anonymised write-ups of finished work. When a client describes a similar problem, the copilot shows you the closest cases.
        </Typography>
        <CaseBook cases={(cases ?? []) as never} projects={projectOptions} aiReady={aiConfigured()} />
      </Box>
    </Stack>
  );
}
