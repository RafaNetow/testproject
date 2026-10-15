"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { STATUS_TONE, figureSx } from "@/lib/palette";
import type { ProgressPhase } from "./project-progress";

export type TimelineMarker = { date: string; label: string; kind: "meeting" | "deliverable" };

const DAY = 86_400_000;
const toMs = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
const short = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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

/**
 * The engagement on a calendar strip: one bar per dated stage (done, current
 * with its own %, upcoming), today's marker, and upcoming meetings and
 * deliverables as diamonds. Becomes a dated list on narrow screens.
 */
export function ProjectTimeline({
  phases,
  markers,
  today,
  narrow,
}: {
  phases: ProgressPhase[];
  markers: TimelineMarker[];
  /** YYYY-MM-DD from the server, so the marker can't cause a hydration mismatch. */
  today: string;
  narrow: boolean;
}) {
  const dated = phases.filter((p) => p.start_date && p.end_date);
  if (!dated.length) return null;

  const currentIndex = phases.findIndex((p) => p.progress_pct < 100);
  const stateOf = (p: ProgressPhase) =>
    p.progress_pct >= 100 ? "done" : phases.indexOf(p) === currentIndex ? "current" : "upcoming";

  if (narrow) {
    return (
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
        {dated.map((p) => {
          const state = stateOf(p);
          return (
            <Box component="li" key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 13 }}>
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
            </Box>
          );
        })}
      </Box>
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
    <Box sx={{ position: "relative" }} role="img" aria-label={`Timeline from ${short(min)} to ${short(max - DAY)}`}>
      {/* Axis */}
      <Box sx={{ display: "flex", mb: 1 }}>
        <Box sx={{ width: LABEL_W, flexShrink: 0 }} />
        <Box sx={{ position: "relative", flex: 1, height: 18 }}>
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

      {/* Stage rows */}
      <Box sx={{ position: "relative", display: "grid", gap: 1 }}>
        {dated.map((p) => {
          const state = stateOf(p);
          const start = toMs(p.start_date!);
          const end = toMs(p.end_date!) + DAY;
          return (
            <Box key={p.id} sx={{ display: "flex", alignItems: "center" }}>
              <Typography noWrap sx={{ width: LABEL_W, flexShrink: 0, pr: 2, fontSize: 13, fontWeight: state === "current" ? 700 : 500, color: state === "upcoming" ? "text.secondary" : "text.primary" }}>
                {p.name}
              </Typography>
              <Box sx={{ position: "relative", flex: 1, height: 26, borderRadius: 1, bgcolor: "var(--fill-track)" }}>
                <Tooltip title={`${p.name}: ${short(start)} – ${short(end - DAY)} · ${p.progress_pct}%`} arrow>
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
                    {state === "current" && (
                      <Box sx={{ height: "100%", width: `${p.progress_pct}%`, bgcolor: "primary.main" }} />
                    )}
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          );
        })}

        {/* Today */}
        {showToday && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: -6,
              bottom: -6,
              left: `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${(todayMs - min) / span})`,
              width: 2,
              bgcolor: STATUS_TONE.error.solid,
              borderRadius: 1,
            }}
          />
        )}
      </Box>

      {/* Milestones + today label */}
      <Box sx={{ display: "flex", mt: 1.25 }}>
        <Typography sx={{ width: LABEL_W, flexShrink: 0, pr: 2, fontSize: 12, color: "text.secondary" }}>Milestones</Typography>
        <Box sx={{ position: "relative", flex: 1, height: 22 }}>
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
    </Box>
  );
}
