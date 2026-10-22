"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { CountUp } from "@/components/shared/count-up";
import { STATUS_TONE, figureSx } from "@/lib/palette";
import { whenRevealed } from "@/lib/route-loader";

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const fillColor = (v: number) => (v >= 100 ? STATUS_TONE.success.solid : "primary.main");

/**
 * MUI's "circular progress with label": a determinate ring with the % inside.
 * The ring fills from 0 once the page loader lifts (MUI's own stroke
 * transition, slowed down); the number counts up alongside it.
 */
export function CircularPercent({
  value,
  size = 64,
  thickness = 4.5,
  label,
}: {
  value: number;
  size?: number;
  thickness?: number;
  /** Accessible name, e.g. "Water-resistant coating: 61% complete". */
  label?: string;
}) {
  const target = clamp(value);
  const [shown, setShown] = useState(0);

  useEffect(() => whenRevealed(() => setShown(target)), [target]);

  return (
    <Box
      role="img"
      aria-label={label ?? `${target}% complete`}
      sx={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        aria-hidden
        sx={{ position: "absolute", inset: 0, color: "var(--fill-neutral)" }}
      />
      <CircularProgress
        variant="determinate"
        value={shown}
        size={size}
        thickness={thickness}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          color: fillColor(target),
          "& .MuiCircularProgress-circle": { strokeLinecap: "round", transition: "stroke-dashoffset 1.1s cubic-bezier(0.2, 0.7, 0.2, 1)" },
        }}
      />
      <Box aria-hidden sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Typography sx={{ ...figureSx, fontSize: Math.round(size * 0.26), fontWeight: 700, color: target >= 100 ? STATUS_TONE.success.text : "text.primary" }}>
          <CountUp value={target} suffix="%" />
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * MUI's "linear progress with label": a determinate bar with the % beside it.
 * The bar fills on reveal (the `.bar-fill` animation) and the number counts up.
 */
export function LinearPercent({
  value,
  height = 6,
  showLabel = true,
  label,
  sx,
}: {
  value: number;
  height?: number;
  showLabel?: boolean;
  label?: string;
  sx?: object;
}) {
  const target = clamp(value);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, ...sx }}>
      <LinearProgress
        className="bar-fill"
        variant="determinate"
        value={target}
        aria-label={label ?? `${target}% complete`}
        sx={{
          flex: 1,
          height,
          borderRadius: 999,
          bgcolor: "var(--fill-neutral)",
          "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: fillColor(target) },
        }}
      />
      {showLabel && (
        <Typography aria-hidden sx={{ ...figureSx, minWidth: 36, textAlign: "right", fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
          <CountUp value={target} suffix="%" />
        </Typography>
      )}
    </Box>
  );
}
