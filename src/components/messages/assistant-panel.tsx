"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AssistantIcon, Send } from "@/components/icons";
import { askAlchemica } from "@/lib/actions/ai";
import type { Source } from "@/lib/ai/format";

type Turn = { question: string; answer?: string; sources?: Source[]; error?: string };

const STARTERS = ["Where are we, and what's next?", "What's waiting on me?", "What have we decided so far?"];

function AssistantAvatar({ size = 28 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        color: "primary.main",
        bgcolor: "color-mix(in srgb, var(--color-accent) 14%, transparent)",
      }}
    >
      <AssistantIcon sx={{ fontSize: size * 0.62 }} />
    </Box>
  );
}

/**
 * "Ask Alchemica": answers questions about the client's own project from its
 * stages, decisions, deliverables and data requests, citing what it used.
 * Read-only — it never changes anything — and it hands technical questions to Axel.
 */
export function AssistantPanel({ projectId, onAskAxel }: { projectId: string; onAskAxel: (question: string) => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setDraft("");
    setTurns((t) => [...t, { question: q }]);
    startTransition(async () => {
      const res = await askAlchemica(projectId, q);
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = res.ok ? { question: q, answer: res.answer, sources: res.sources } : { question: q, error: res.message };
        return next;
      });
    });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Box ref={scrollRef} role="log" aria-live="polite" aria-label="Assistant conversation" sx={{ flex: 1, overflowY: "auto", px: 2, py: 2.5 }}>
        {turns.length === 0 && (
          <Box sx={{ textAlign: "center", px: 1, pt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <AssistantAvatar size={52} />
            </Box>
            <Typography sx={{ mt: 1.5, fontWeight: 700 }}>Ask Alchemica</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
              I answer from your project&apos;s stages, decisions, deliverables and data requests. For anything technical, I&apos;ll pass you to Axel.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
              {STARTERS.map((s) => (
                <Chip key={s} label={s} variant="outlined" clickable onClick={() => ask(s)} sx={{ fontSize: 13 }} />
              ))}
            </Box>
          </Box>
        )}

        {turns.map((t, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ maxWidth: "80%", px: 1.75, py: 1, borderRadius: 2, borderBottomRightRadius: 4, bgcolor: "primary.main", color: "primary.contrastText" }}>
                <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{t.question}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "flex-start" }}>
              <AssistantAvatar />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ mb: 0.25, fontSize: 12, color: "text.muted" }}>
                  Alchemica Assistant ·{" "}
                  <Box component="span" sx={{ px: 0.5, borderRadius: 0.5, fontWeight: 700, bgcolor: "var(--fill-neutral)" }}>
                    AI
                  </Box>
                </Typography>
                {t.error ? (
                  <Alert severity="info" sx={{ fontSize: 13 }}>
                    {t.error}
                  </Alert>
                ) : t.answer ? (
                  <>
                    <Box sx={{ px: 1.75, py: 1, borderRadius: 2, borderBottomLeftRadius: 4, bgcolor: "var(--fill-neutral)" }}>
                      {/* Plain text only — the answer is never rendered as HTML. */}
                      <Typography sx={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{t.answer}</Typography>
                    </Box>
                    {t.sources && t.sources.length > 0 && (
                      <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }} aria-label="Sources">
                        {t.sources.map((s) => (
                          <Chip key={s.id} component={NextLink} href={s.href} clickable size="small" variant="outlined" label={s.title} sx={{ maxWidth: 220, fontSize: 12 }} />
                        ))}
                      </Box>
                    )}
                    <Button size="small" color="inherit" onClick={() => onAskAxel(t.question)} sx={{ mt: 0.5, ml: -0.75, fontSize: 12, color: "text.secondary" }}>
                      Ask Axel instead
                    </Button>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 13, color: "text.muted" }}>Thinking…</Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, pt: 1.5, pb: 2 }}>
        <Typography sx={{ mb: 1, fontSize: 12, color: "text.muted" }}>
          AI answers can be incomplete. Decisions and technical advice always come from Axel.
        </Typography>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}
        >
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your project…"
            multiline
            maxRows={4}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { "aria-label": "Question for the assistant", maxLength: 1000 } }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                ask(draft);
              }
            }}
          />
          <Button type="submit" variant="contained" disabled={pending || !draft.trim()} sx={{ minHeight: 40 }} aria-label="Ask">
            <Send sx={{ fontSize: 18 }} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
