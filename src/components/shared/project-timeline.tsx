"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { CloudUploadOutlined, ExpandMore, Inventory2Outlined, VideocamOutlined, type IconComponent } from "@/components/icons";
import { STATUS_TONE, figureSx } from "@/lib/palette";
import { phaseSchedule, type ScheduleTone } from "@/lib/phase-schedule";
import type { StageItem, StageItemKind } from "@/lib/stage-items";
import { StatusBadge } from "./status-badge";
import type { ProgressPhase } from "./project-progress";

export type TimelineMarker = { date: string; label: string; kind: "meeting" | "deliverable" };

const DAY = 86_400_000;
const toMs = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
const short = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const MAX_ITEMS = 6;

const ITEM_ICON: Record<StageItemKind, { icon: IconComponent; label: string }> = {
  deliverable: { icon: Inventory2Outlined, label: "Deliverable" },
  meeting: { icon: VideocamOutlined, label: "Meeting" },
  request: { icon: CloudUploadOutlined, label: "Data we need" },
};

const SCHEDULE_TONE: Record<ScheduleTone, (typeof STATUS_TONE)[keyof typeof STATUS_TONE]> = {
  neutral: STATUS_TONE.neutral,
  accent: STATUS_TONE.primary,
  warning: STATUS_TONE.warning,
};

/** Month ticks for long ranges, Monday ticks for short ones. */
function ticks(min: number, max: number) {
  const out: { ms: number; label: string }[] = [];
  if (max - min > 70 * DAY) {
    const d = new Date(min);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    while (d.getTime() <= max) {
      out.push({ ms: d.getTime(), label: d.toLocaleDateString("en-GB", { month: "short" }) });
      d.setMonth(d.getMonth() + 1);
    }
  } else {
    const d = new Date(min);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    while (d.getTime() <= max) {
      out.push({ ms: d.getTime(), label: short(d.getTime()) });
      d.setDate(d.getDate() + 7);
    }
  }
  return out;
}

/** Items whose date falls inside the stage (inclusive). */
function itemsIn(p: ProgressPhase, items: StageItem[]) {
  if (!p.start_date || !p.end_date) return [];
  return items.filter((i) => i.date >= p.start_date!.slice(0, 10) && i.date <= p.end_date!.slice(0, 10));
}

/** What opens under a stage: dates, % and schedule, the plain-language description, and what falls in it. */
function StageDetail({ phase, items, today, isAdmin, id }: { phase: ProgressPhase; items: StageItem[]; today: string; isAdmin: boolean; id: string }) {
  const schedule = phaseSchedule({ start: phase.start_date, end: phase.end_date, pct: phase.progress_pct, today });
  const tone = schedule ? SCHEDULE_TONE[schedule.tone] : null;
  const shown = items.slice(0, MAX_ITEMS);

  return (
    <Box id={id} sx={{ mt: 1, mb: 1.5, px: 2, py: 1.75, borderRadius: 1.5, bgcolor: "var(--fill-track)" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
        <Typography sx={{ ...figureSx, fontSize: 12, color: "text.secondary" }}>
          {phase.start_date && phase.end_date ? `${short(toMs(phase.start_date))} – ${short(toMs(phase.end_date))} · ` : ""}
          {phase.progress_pct}%
        </Typography>
        {schedule && tone && (
          <Box component="span" sx={{ px: 1, height: 22, display: "inline-flex", alignItems: "center", borderRadius: 999, fontSize: 12, fontWeight: 700, bgcolor: tone.bg, color: tone.text }}>
            {schedule.label}
          </Box>
        )}
      </Box>

      {phase.description ? (
        <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>{phase.description}</Typography>
      ) : (
        isAdmin && (
          <Typography sx={{ mt: 1, fontSize: 13, color: "text.muted" }}>
            Add a description in Progress &amp; stages so the client knows what happens here.
          </Typography>
        )
      )}

      {shown.length > 0 && (
        <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0, display: "grid", gap: 0.75 }}>
          {shown.map((item) => {
            const { icon: Icon, label } = ITEM_ICON[item.kind];
            return (
              <Box component="li" key={`${item.kind}-${item.title}-${item.date}`} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Tooltip title={label}>
                  <Box component="span" sx={{ display: "inline-flex", color: "text.secondary" }}>
                    <Icon titleAccess={label} sx={{ fontSize: 16 }} />
                  </Box>
                </Tooltip>
                <Link component={NextLink} href={item.href} underline="hover" noWrap sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "text.primary" }}>
                  {item.title}
                </Link>
                <Typography sx={{ ...figureSx, fontSize: 12, color: "text.muted", flexShrink: 0 }}>{short(toMs(item.date))}</Typography>
                <StatusBadge status={item.status} />
              </Box>
            );
          })}
          {items.length > MAX_ITEMS && (
            <Typography component="li" sx={{ fontSize: 12, color: "text.muted" }}>
              +{items.length - MAX_ITEMS} more
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

/**
 * The engagement on a calendar strip: one bar per dated stage (done, current
 * with its own %, upcoming), today's marker, and upcoming meetings and
 * deliverables as diamonds. Each stage opens to show what happens in it,
 * whether it's on time, and what falls in it. Becomes a dated list on narrow
 * screens.
 */
export function ProjectTimeline({
  phases,
  markers,
  items = [],
  today,
  narrow,
  isAdmin = false,
}: {
  phases: ProgressPhase[];
  markers: TimelineMarker[];
  items?: StageItem[];
  /** YYYY-MM-DD from the server, so the marker can't cause a hydration mismatch. */
  today: string;
  narrow: boolean;
  isAdmin?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const dated = phases.filter((p) => p.start_date && p.end_date);
  if (!dated.length) return null;

  const currentIndex = phases.findIndex((p) => p.progress_pct < 100);
  const stateOf = (p: ProgressPhase) =>
    p.progress_pct >= 100 ? "done" : phases.indexOf(p) === currentIndex ? "current" : "upcoming";
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  const detailId = (id: string) => `stage-detail-${id}`;

  const caret = (open: boolean) => (
    <ExpandMore aria-hidden sx={{ fontSize: 16, flexShrink: 0, color: "text.muted", transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }} />
  );
  const hint = (
    <Typography sx={{ mt: 1.25, fontSize: 12, color: "text.muted" }}>Select a stage to see what happens in it.</Typography>
  );

  if (narrow) {
    return (
      <>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.5 }}>
          {dated.map((p) => {
            const state = stateOf(p);
            const open = openId === p.id;
            return (
              <Box component="li" key={p.id}>
                <ButtonBase
                  onClick={() => toggle(p.id)}
                  aria-expanded={open}
                  aria-controls={detailId(p.id)}
                  sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1.25, py: 0.75, px: 0.5, borderRadius: 1, textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 10,
                      height: 10,
                      flexShrink: 0,
                      borderRadius: "50%",
                      bgcolor: state === "done" ? STATUS_TONE.success.solid : state === "current" ? "primary.main" : "var(--border-control)",
                    }}
                  />
                  <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: state === "current" ? 700 : 500 }} noWrap>
                    {p.name}
                  </Typography>
                  <Typography sx={{ ...figureSx, fontSize: 12, color: "text.secondary" }}>
                    {short(toMs(p.start_date!))} – {short(toMs(p.end_date!))}
                  </Typography>
                  {caret(open)}
                </ButtonBase>
                <Collapse in={open} unmountOnExit>
                  <StageDetail phase={p} items={itemsIn(p, items)} today={today} isAdmin={isAdmin} id={detailId(p.id)} />
                </Collapse>
              </Box>
            );
          })}
        </Box>
        {hint}
      </>
    );
  }

  const min = Math.min(...dated.map((p) => toMs(p.start_date!)));
  const max = Math.max(...dated.map((p) => toMs(p.end_date!))) + DAY;
  const span = max - min;
  const pos = (ms: number) => `${((ms - min) / span) * 100}%`;
  const todayMs = toMs(today);
  const showToday = todayMs >= min && todayMs <= max;
  const visibleMarkers = markers.filter((m) => {
    const ms = toMs(m.date);
    return ms >= min && ms <= max;
  });
  const LABEL_W = 168;

  return (
    <Box sx={{ position: "relative" }} aria-label={`Timeline from ${short(min)} to ${short(max - DAY)}`} role="group">
      {/* Axis */}
      <Box sx={{ display: "flex", mb: 1 }}>
        <Box sx={{ width: LABEL_W, flexShrink: 0 }} />
        <Box sx={{ position: "relative", flex: 1, height: 18, mr: 3 }}>
          {ticks(min, max).map((t) => (
            <Typography
              key={t.ms}
              component="span"
              sx={{ ...figureSx, position: "absolute", left: pos(t.ms), transform: "translateX(-50%)", fontSize: 11, color: "text.secondary", whiteSpace: "nowrap" }}
            >
              {t.label}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Stage rows — each opens its detail */}
      <Box sx={{ display: "grid", gap: 0.5 }}>
        {dated.map((p) => {
          const state = stateOf(p);
          const start = toMs(p.start_date!);
          const end = toMs(p.end_date!) + DAY;
          const open = openId === p.id;
          return (
            <Box key={p.id}>
              <ButtonBase
                onClick={() => toggle(p.id)}
                aria-expanded={open}
                aria-controls={detailId(p.id)}
                aria-label={`${p.name}, ${short(start)} to ${short(end - DAY)}, ${p.progress_pct}%`}
                sx={{ width: "100%", display: "flex", alignItems: "center", py: 0.5, borderRadius: 1, textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Typography noWrap sx={{ width: LABEL_W, flexShrink: 0, pl: 0.5, pr: 2, fontSize: 13, fontWeight: state === "current" ? 700 : 500, color: state === "upcoming" ? "text.secondary" : "text.primary" }}>
                  {p.name}
                </Typography>
                <Box sx={{ position: "relative", flex: 1, height: 26, borderRadius: 1, bgcolor: "var(--fill-track)" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 3,
                      bottom: 3,
                      left: pos(start),
                      width: `calc(${pos(end)} - ${pos(start)})`,
                      minWidth: 6,
                      borderRadius: 0.75,
                      overflow: "hidden",
                      bgcolor:
                        state === "done"
                          ? STATUS_TONE.success.solid
                          : state === "current"
                            ? "color-mix(in srgb, var(--color-accent) 22%, transparent)"
                            : "var(--border-outline)",
                    }}
                  >
                    {state === "current" && <Box sx={{ height: "100%", width: `${p.progress_pct}%`, bgcolor: "primary.main" }} />}
                  </Box>
                  {showToday && (
                    <Box aria-hidden sx={{ position: "absolute", top: -3, bottom: -3, left: pos(todayMs), width: 2, ml: "-1px", bgcolor: STATUS_TONE.error.solid, borderRadius: 1 }} />
                  )}
                </Box>
                <Box sx={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}>{caret(open)}</Box>
              </ButtonBase>
              <Collapse in={open} unmountOnExit>
                <Box sx={{ pl: { md: `${LABEL_W}px` }, pr: 3 }}>
                  <StageDetail phase={p} items={itemsIn(p, items)} today={today} isAdmin={isAdmin} id={detailId(p.id)} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Milestones + today label */}
      <Box sx={{ display: "flex", mt: 1.25 }}>
        <Typography sx={{ width: LABEL_W, flexShrink: 0, pl: 0.5, pr: 2, fontSize: 12, color: "text.secondary" }}>Milestones</Typography>
        <Box sx={{ position: "relative", flex: 1, height: 22, mr: 3 }}>
          {showToday && (
            <Typography
              component="span"
              sx={{ position: "absolute", left: pos(todayMs), transform: "translateX(-50%)", top: 2, fontSize: 11, fontWeight: 700, color: STATUS_TONE.error.text }}
            >
              Today
            </Typography>
          )}
          {visibleMarkers.map((m) => (
            <Tooltip key={`${m.kind}-${m.date}-${m.label}`} title={`${m.kind === "meeting" ? "Meeting" : "Deliverable due"}: ${m.label} · ${short(toMs(m.date))}`} arrow>
              <Box
                tabIndex={0}
                aria-label={`${m.kind === "meeting" ? "Meeting" : "Deliverable due"}: ${m.label}, ${short(toMs(m.date))}`}
                sx={{
                  position: "absolute",
                  left: pos(toMs(m.date)),
                  top: 4,
                  width: 12,
                  height: 12,
                  transform: "translateX(-50%) rotate(45deg)",
                  borderRadius: "2px",
                  bgcolor: m.kind === "meeting" ? "var(--color-accent)" : "var(--color-secondary)",
                  cursor: "help",
                  "&:focus-visible": { outline: "2px solid var(--color-accent)", outlineOffset: 2 },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
      {hint}
    </Box>
  );
}
