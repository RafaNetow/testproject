"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { STATUS_TONE, figureSx } from "@/lib/palette";
import { ProjectTimeline, type TimelineMarker } from "./project-timeline";
import type { StageItem } from "@/lib/stage-items";
import { CountUp } from "@/components/shared/count-up";
import { Check, ExpandMore } from "@/components/icons";

export type ProgressPhase = {
  id: string;
  name: string;
  progress_pct: number;
  start_date?: string | null;
  end_date?: string | null;
  /** What happens in the stage, in plain words (shown when it's opened on the timeline). */
  description?: string | null;
};

const DONE = STATUS_TONE.success;

/**
 * Where a project stands: its overall percentage and each stage on a
 * timeline. Done stages are checked, the first unfinished one is "current"
 * with its own bar, the rest wait in grey. Shared by the client's summary and
 * the admin's client page, so both always see the same thing.
 */
export function ProjectProgress({
  name,
  total,
  phases,
  flat,
  titleExtra,
  markers = [],
  items = [],
  today,
  collapseTimeline,
  isAdmin = false,
}: {
  name: string;
  /** Shown beside the project name — e.g. its status label. */
  titleExtra?: ReactNode;
  total: number;
  phases: ProgressPhase[];
  /** Drop the card chrome when it sits inside another card. */
  flat?: boolean;
  /** Upcoming meetings and deliverable due dates, drawn on the timeline. */
  markers?: TimelineMarker[];
  /** YYYY-MM-DD from the server; enables the timeline's "today" marker. */
  today?: string;
  /** Start with the timeline folded away — the admin's client page lists many projects. */
  collapseTimeline?: boolean;
  /** Deliverables, meetings and data requests; each shows under the stage its date falls in. */
  items?: StageItem[];
  /** The admin gets a nudge to describe stages that have no description yet. */
  isAdmin?: boolean;
}) {
  const [timelineOpen, setTimelineOpen] = useState(!collapseTimeline);
  const narrow = useMediaQuery("(max-width: 767px)", { noSsr: false });
  const currentIndex = phases.findIndex((p) => p.progress_pct < 100);
  const activeStep = currentIndex === -1 ? phases.length : currentIndex;
  const complete = phases.length > 0 && currentIndex === -1;

  const body = (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
            {complete ? "Completed" : phases[activeStep] ? `Now: ${phases[activeStep].name}` : "Not started"}
          </Typography>
          <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Typography variant="h3" noWrap sx={{ fontSize: 18 }}>
              {name}
            </Typography>
            {titleExtra}
          </Box>
        </Box>
        <Typography sx={{ ...figureSx, flexShrink: 0, fontSize: 32, fontWeight: 700, lineHeight: 1, color: complete ? DONE.text : "primary.main" }}>
          <CountUp value={total} suffix="%" />
        </Typography>
      </Box>

      <LinearProgress
        className="bar-fill"
        variant="determinate"
        value={total}
        aria-label={`${name}: ${total}% complete`}
        sx={{
          mt: 2,
          height: 8,
          borderRadius: 999,
          bgcolor: "var(--fill-neutral)",
          "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: complete ? DONE.solid : "primary.main" },
        }}
      />

      {phases.length > 0 && (
        <Stepper
          activeStep={activeStep}
          orientation={narrow ? "vertical" : "horizontal"}
          alternativeLabel={!narrow}
          sx={{ mt: 3.5, "& .MuiStepConnector-line": { borderColor: "var(--border-outline)" } }}
        >
          {phases.map((phase, i) => {
            const done = phase.progress_pct >= 100;
            const current = i === currentIndex;
            return (
              <Step key={phase.id} completed={done}>
                <StepLabel slots={{ stepIcon: PhaseIcon }}>
                  <Typography component="span" sx={{ display: "block", fontSize: 13, fontWeight: current ? 700 : 600, color: done || current ? "text.primary" : "text.secondary" }}>
                    {phase.name}
                  </Typography>
                  <Typography component="span" sx={{ ...figureSx, display: "block", mt: 0.25, fontSize: 12, fontWeight: 600, color: done ? DONE.text : current ? "primary.main" : "text.muted" }}>
                    {done ? "Done" : `${phase.progress_pct}%`}
                  </Typography>
                  {current && phase.progress_pct > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={phase.progress_pct}
                      sx={{ mt: 0.75, mx: narrow ? 0 : "auto", width: narrow ? 120 : "60%", height: 4, borderRadius: 999, bgcolor: "var(--fill-neutral)", "& .MuiLinearProgress-bar": { borderRadius: 999 } }}
                    />
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}

      {today && phases.some((p) => p.start_date && p.end_date) && (
        <Box sx={{ mt: 3.5, pt: 3, borderTop: "1px dashed var(--border-dashed)" }}>
          {collapseTimeline ? (
            <Button
              size="small"
              color="inherit"
              onClick={() => setTimelineOpen((o) => !o)}
              aria-expanded={timelineOpen}
              endIcon={<ExpandMore sx={{ transform: timelineOpen ? "rotate(180deg)" : undefined, transition: "transform 150ms" }} />}
              sx={{ mb: timelineOpen ? 1.5 : 0, ml: -1, fontSize: 13, fontWeight: 700, color: "text.secondary" }}
            >
              Timeline
            </Button>
          ) : (
            <Typography component="h3" sx={{ mb: 1.5, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
              Timeline
            </Typography>
          )}
          {timelineOpen && <ProjectTimeline phases={phases} markers={markers} items={items} today={today} narrow={narrow} isAdmin={isAdmin} />}
        </Box>
      )}
    </>
  );

  if (flat) return <Box>{body}</Box>;
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {body}
    </Paper>
  );
}

/** Step icon: green check when done, a highlighted number for the current stage, grey otherwise. */
function PhaseIcon({ completed: done, active: current, icon }: StepIconProps) {
  return (
    <Box
      className={current ? "stage-pulse" : undefined}
      sx={{
        display: "grid",
        placeItems: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        ...figureSx,
        fontSize: 13,
        fontWeight: 700,
        ...(done
          ? { bgcolor: DONE.solid, color: "var(--color-success-foreground)" }
          : current
            ? { bgcolor: "primary.main", color: "primary.contrastText", boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent)" }
            : { bgcolor: "var(--fill-neutral)", color: "text.secondary" }),
      }}
    >
      {done ? <Check sx={{ fontSize: 16 }} /> : icon}
    </Box>
  );
}
