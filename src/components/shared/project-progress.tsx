"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Check from "@mui/icons-material/Check";
import { STATUS_TONE, figureSx } from "@/lib/palette";

export type ProgressPhase = { id: string; name: string; progress_pct: number };

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
}: {
  name: string;
  /** Shown beside the project name — e.g. its status label. */
  titleExtra?: ReactNode;
  total: number;
  phases: ProgressPhase[];
  /** Drop the card chrome when it sits inside another card. */
  flat?: boolean;
}) {
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
          {total}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={total}
        aria-label={`${name}: ${total}% complete`}
        sx={{
          mt: 2,
          height: 8,
          borderRadius: 999,
          bgcolor: "rgb(145 158 171 / 0.16)",
          "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: complete ? DONE.solid : "primary.main" },
        }}
      />

      {phases.length > 0 && (
        <Stepper
          activeStep={activeStep}
          orientation={narrow ? "vertical" : "horizontal"}
          alternativeLabel={!narrow}
          sx={{ mt: 3.5, "& .MuiStepConnector-line": { borderColor: "rgb(145 158 171 / 0.32)" } }}
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
                      sx={{ mt: 0.75, mx: narrow ? 0 : "auto", width: narrow ? 120 : "60%", height: 4, borderRadius: 999, bgcolor: "rgb(145 158 171 / 0.16)", "& .MuiLinearProgress-bar": { borderRadius: 999 } }}
                    />
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
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
          ? { bgcolor: DONE.solid, color: "#fff" }
          : current
            ? { bgcolor: "primary.main", color: "primary.contrastText", boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent)" }
            : { bgcolor: "rgb(145 158 171 / 0.16)", color: "text.secondary" }),
      }}
    >
      {done ? <Check sx={{ fontSize: 16 }} /> : icon}
    </Box>
  );
}
