"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { STATUS_TONE, figureSx, type Tone } from "@/lib/palette";
import { whenRevealed } from "@/lib/route-loader";
import { CountUp } from "@/components/shared/count-up";
import type { WaitingItem, WaitingKind } from "@/lib/waiting";
import { ChatOutlined, CloudUploadOutlined, DrawOutlined, HelpOutlineOutlined, SummarizeOutlined, TaskAltOutlined, type IconComponent } from "@/components/icons";

const KIND: Record<WaitingKind, { icon: IconComponent; tone: Tone; verb: string; action: string }> = {
  review: { icon: SummarizeOutlined, tone: STATUS_TONE.warning, verb: "Review the deliverable", action: "Review" },
  sign: { icon: DrawOutlined, tone: STATUS_TONE.warning, verb: "Sign", action: "Sign" },
  upload: { icon: CloudUploadOutlined, tone: STATUS_TONE.primary, verb: "Send us", action: "Upload" },
  answer: { icon: HelpOutlineOutlined, tone: STATUS_TONE.info, verb: "We need your input on", action: "Answer" },
  reply: { icon: ChatOutlined, tone: STATUS_TONE.primary, verb: "Read", action: "Open" },
};

/** Donut colours: one per kind, so the ring reads at a glance (the legend names them). */
const RING: Record<WaitingKind, { color: string; label: string }> = {
  review: { color: "var(--color-warning)", label: "To review" },
  sign: { color: "color-mix(in srgb, var(--color-warning) 55%, var(--color-error))", label: "To sign" },
  upload: { color: "var(--color-accent)", label: "To upload" },
  answer: { color: "color-mix(in srgb, var(--color-accent) 45%, var(--color-muted-foreground))", label: "To answer" },
  reply: { color: "var(--color-muted-foreground)", label: "To read" },
};
const RING_ORDER: WaitingKind[] = ["review", "sign", "upload", "answer", "reply"];

/**
 * What's waiting, by kind, as a ring that fills on arrival. Each slice and its
 * legend chip filter the list below; pressing again shows everything.
 */
function WaitingRing({ items, only, onPick }: { items: WaitingItem[]; only: WaitingKind | null; onPick: (k: WaitingKind | null) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => whenRevealed(() => setReady(true)), []);
  const counts = RING_ORDER.map((k) => ({ k, n: items.filter((i) => i.kind === k).length })).filter((c) => c.n > 0);
  const total = items.length;
  const R = 34;
  const C = 2 * Math.PI * R;
  // Where each slice starts along the ring.
  const slices = counts.map((c, i) => ({ ...c, len: (c.n / total) * C, start: counts.slice(0, i).reduce((sum, x) => sum + (x.n / total) * C, 0) }));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
      <Box sx={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
        <svg viewBox="0 0 92 92" width={92} height={92} aria-hidden style={{ transform: "rotate(-90deg)" }}>
          <circle cx={46} cy={46} r={R} fill="none" stroke="var(--fill-neutral)" strokeWidth={10} />
          {slices.map(({ k, len, start }) => (
              <circle
                key={k}
                cx={46}
                cy={46}
                r={R}
                fill="none"
                stroke={RING[k].color}
                strokeWidth={only === k ? 13 : 10}
                strokeDasharray={`${ready ? Math.max(0, len - 2) : 0} ${C}`}
                strokeDashoffset={-start}
                opacity={only && only !== k ? 0.3 : 1}
                style={{ transition: "stroke-dasharray 1s cubic-bezier(0.2, 0.7, 0.2, 1), stroke-width 150ms, opacity 150ms", cursor: "pointer" }}
                onClick={() => onPick(only === k ? null : k)}
              />
          ))}
        </svg>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <Typography sx={{ ...figureSx, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            <CountUp value={only ? counts.find((c) => c.k === only)?.n ?? 0 : total} />
          </Typography>
        </Box>
      </Box>
      <Box role="group" aria-label="Filter by kind" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, maxWidth: 300 }}>
        {counts.map(({ k, n }) => (
          <ButtonBase
            key={k}
            onClick={() => onPick(only === k ? null : k)}
            aria-pressed={only === k}
            sx={{
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: 1,
              borderColor: only === k ? RING[k].color : "var(--border-outline)",
              bgcolor: only === k ? "action.selected" : "transparent",
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: RING[k].color }} />
            {RING[k].label} · {n}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

function dueLabel(due: string) {
  const date = new Date(`${due}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Everything the client has to do, in one list with one button each — the
 * first thing they see after the opening card.
 */
export function WaitingOnYou({
  items,
  showProject,
  today,
}: {
  items: WaitingItem[];
  showProject: boolean;
  /** YYYY-MM-DD, from the server, to flag overdue items without a hydration mismatch. */
  today: string;
}) {
  const [only, setOnly] = useState<WaitingKind | null>(null);
  const shown = only ? items.filter((i) => i.kind === only) : items;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, px: 3, pt: 3, pb: 1.5 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: 18 }}>
            Waiting on you
          </Typography>
          {items.length > 0 && (
            <Typography sx={{ ...figureSx, mt: 0.5, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
              {only ? `${shown.length} of ${items.length} shown` : `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </Typography>
          )}
        </Box>
        {items.length > 1 && <WaitingRing items={items} only={only} onPick={setOnly} />}
      </Box>

      {items.length === 0 ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, pb: 3, pt: 1 }}>
          <TaskAltOutlined sx={{ color: STATUS_TONE.success.solid }} />
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Nothing is waiting on you — we&apos;ll let you know when something is.
          </Typography>
        </Box>
      ) : (
        <Box component="ul" className="stagger" sx={{ listStyle: "none", m: 0, p: 0, pb: 1 }}>
          {shown.map((item) => {
            const kind = KIND[item.kind];
            const Icon = kind.icon;
            return (
              <Box
                component="li"
                key={`${item.kind}-${item.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mx: 1,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 1.5,
                    bgcolor: kind.tone.bg,
                    color: kind.tone.text,
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                    {kind.verb} <Box component="span" sx={{ color: "primary.main" }}>&ldquo;{item.title}&rdquo;</Box>
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.secondary" }}>
                    {showProject && item.projectName}
                    {showProject && item.projectName && (item.due ? " · " : "")}
                    {item.due ? (
                      item.due < today ? (
                        <Box component="span" sx={{ color: STATUS_TONE.error.text, fontWeight: 700 }}>
                          Overdue · was due {dueLabel(item.due)}
                        </Box>
                      ) : (
                        `Due ${dueLabel(item.due)}`
                      )
                    ) : (
                      !(showProject && item.projectName) && "No due date"
                    )}
                  </Typography>
                </Box>
                <Button
                  href={item.href}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  sx={{ flexShrink: 0, minHeight: 36 }}
                >
                  {kind.action}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
