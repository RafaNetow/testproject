"use client";

import { useActionState, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { SelectField } from "@/components/shared/select-field";
import { AssistantIcon, DeleteOutlined } from "@/components/icons";
import { deleteCase, generateCaseDraft, saveCase, type LearnResult } from "@/lib/actions/ai-learning";
import type { CaseDraft } from "@/lib/ai/learning";

type Case = { id: string; title: string; problem: string; findings: string; outcome: string; tags: string[] };
type ProjectOption = { id: string; label: string };

/**
 * The case book: anonymised write-ups of finished work. Axel picks a project,
 * the assistant drafts the entry with names removed, Axel edits and saves it;
 * later drafts search it for similar problems.
 */
export function CaseBook({ cases, projects, aiReady }: { cases: Case[]; projects: ProjectOption[]; aiReady: boolean }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [draft, setDraft] = useState<{ value: CaseDraft; projectId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafting, startDraft] = useTransition();
  const [saved, formAction, saving] = useActionState<LearnResult | null, FormData>(async (prev, fd) => {
    const res = await saveCase(prev, fd);
    if (res.ok) setDraft(null);
    return res;
  }, null);

  function generate() {
    setError(null);
    startDraft(async () => {
      const res = await generateCaseDraft(projectId);
      if (res.ok) setDraft({ value: res.draft, projectId: res.projectId });
      else setError(res.message);
    });
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>Add a case from a project</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
          The assistant writes a short entry with company and people&apos;s names removed. You read it, edit it and save it.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end" }}>
          <SelectField label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} sx={{ minWidth: 280, flex: 1 }}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectField>
          <Button variant="outlined" color="secondary" onClick={generate} disabled={!aiReady || drafting || !projectId} startIcon={<AssistantIcon sx={{ fontSize: 18 }} />}>
            {drafting ? "Drafting…" : "Draft with AI"}
          </Button>
        </Box>
        {!aiReady && (
          <Typography sx={{ mt: 1, fontSize: 12, color: "warning.main" }}>AI isn&apos;t configured — add the AI_* keys to .env.local.</Typography>
        )}
        {error && (
          <Alert severity="info" sx={{ mt: 1.5, fontSize: 13 }}>
            {error}
          </Alert>
        )}

        {draft && (
          <Box component="form" action={formAction} key={JSON.stringify(draft.value)} sx={{ mt: 2, display: "grid", gap: 1.5 }}>
            <input type="hidden" name="source_project_id" value={draft.projectId} />
            <TextField name="title" label="Title" defaultValue={draft.value.title} required />
            <TextField name="problem" label="Problem" defaultValue={draft.value.problem} multiline minRows={2} />
            <TextField name="findings" label="Findings" defaultValue={draft.value.findings} multiline minRows={2} />
            <TextField name="outcome" label="Outcome" defaultValue={draft.value.outcome} multiline minRows={2} />
            <TextField name="tags" label="Tags (comma separated)" defaultValue={draft.value.tags.join(", ")} />
            <Alert severity="warning" sx={{ fontSize: 13 }}>
              Check that nothing identifies the client (names, products, lot numbers) before saving.
            </Alert>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving…" : "Save to the case book"}
              </Button>
              <Button color="inherit" onClick={() => setDraft(null)}>
                Discard
              </Button>
            </Box>
          </Box>
        )}
        {saved && (
          <Alert severity={saved.ok ? "success" : "error"} sx={{ mt: 1.5, fontSize: 13 }}>
            {saved.message}
          </Alert>
        )}
      </Paper>

      {cases.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No cases yet. The first one you save will start the case book.</Typography>
      ) : (
        <Box component="ul" className="stagger" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.5 }}>
          {cases.map((c) => (
            <Paper component="li" key={c.id} variant="outlined" sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{c.title}</Typography>
                <CaseDelete id={c.id} title={c.title} />
              </Box>
              {[
                ["Problem", c.problem],
                ["Findings", c.findings],
                ["Outcome", c.outcome],
              ]
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <Typography key={label} sx={{ mt: 0.75, fontSize: 13.5, lineHeight: 1.55 }}>
                    <b>{label}.</b> {text}
                  </Typography>
                ))}
              {c.tags.length > 0 && (
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {c.tags.map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: 12 }} />
                  ))}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

function CaseDelete({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteCase.bind(null, id)}>
      <ConfirmButton
        confirmText={`Remove "${title}" from the case book?`}
        ariaLabel={`Delete case "${title}"`}
        icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
      />
    </form>
  );
}
