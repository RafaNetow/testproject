"use client";

import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Zoom from "@mui/material/Zoom";
import type { StepIconProps } from "@mui/material/StepIcon";
import { Check } from "@/components/icons";
import { useRevealed } from "@/components/shared/motion";
import { figureSx } from "@/lib/palette";

const STEPS: Record<string, string[]> = {
  default: ["Draft", "Sent", "Signed"],
  partially_signed: ["Draft", "Sent", "Partly signed", "Signed"],
};
const ACTIVE: Record<string, number> = { draft: 0, sent: 1, partially_signed: 2, signed: 99 };

/**
 * Where a contract is in its signing, as an MUI Stepper: finished steps pop
 * in one after another once the page loader lifts, and the current step
 * pulses until someone acts on it.
 */
export function SigningSteps({ status }: { status: string }) {
  const revealed = useRevealed();
  const steps = STEPS[status] ?? STEPS.default;
  const active = Math.min(ACTIVE[status] ?? 0, steps.length);

  function Icon({ completed, active: isActive, icon }: StepIconProps) {
    const index = Number(icon) - 1;
    if (completed) {
      return (
        <Zoom in={revealed} style={{ transitionDelay: revealed ? `${index * 160}ms` : "0ms" }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Check sx={{ fontSize: 13 }} />
          </Box>
        </Zoom>
      );
    }
    return (
      <Box
        className={isActive ? "stage-pulse" : undefined}
        sx={{
          ...figureSx,
          display: "grid",
          placeItems: "center",
          width: 22,
          height: 22,
          borderRadius: "50%",
          fontSize: 11,
          fontWeight: 700,
          bgcolor: isActive ? "primary.main" : "var(--fill-neutral)",
          color: isActive ? "primary.contrastText" : "text.secondary",
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <Stepper
      activeStep={active}
      alternativeLabel
      aria-label={`Signing: ${status === "signed" ? "signed" : `step ${active + 1} of ${steps.length}, ${steps[active]}`}`}
      sx={{
        mt: 1.5,
        maxWidth: 420,
        "& .MuiStepLabel-label": { mt: "4px !important", fontSize: 12 },
        "& .MuiStepConnector-root": { top: 11 },
        "& .MuiStepConnector-line": { borderColor: "var(--border-outline)" },
        "& .Mui-completed .MuiStepConnector-line, & .Mui-active .MuiStepConnector-line": { borderColor: "primary.main" },
      }}
    >
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel slots={{ stepIcon: Icon }}>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
