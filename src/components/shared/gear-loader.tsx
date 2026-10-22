"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const LINES = ["Mixing your data", "Heating the samples", "Reading the spectra", "Almost ready"];

/** A gear outline with a centre hole, as one SVG path (even-odd fill), centred on 0,0. */
function gearPath(teeth: number, outer: number, inner: number, hole: number) {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [r, t] of [
      [inner, a - step * 0.27],
      [outer, a - step * 0.14],
      [outer, a + step * 0.14],
      [inner, a + step * 0.27],
    ] as const) {
      pts.push(`${(r * Math.cos(t)).toFixed(2)},${(r * Math.sin(t)).toFixed(2)}`);
    }
  }
  const ring = `M${hole},0A${hole},${hole} 0 1 0 ${-hole},0A${hole},${hole} 0 1 0 ${hole},0Z`;
  return `M${pts.join("L")}Z${ring}`;
}

const BIG = gearPath(10, 48, 38, 14);
const SMALL = gearPath(8, 48, 36, 16);

function Gear({ d, size, spin, sx }: { d: string; size: number; spin: string; sx: object }) {
  return (
    <Box
      component="svg"
      viewBox="-50 -50 100 100"
      aria-hidden
      sx={{ position: "absolute", width: size, height: size, animation: spin, ...sx }}
    >
      <path d={d} fillRule="evenodd" fill="currentColor" />
    </Box>
  );
}

/**
 * The loading screen: two meshing gears in the brand accent, a lab line that
 * changes while you wait, and a thin running bar. It fades in after a short
 * delay so quick page changes never flash it. With "reduce motion" the gears
 * stand still and the line stays put (the global reduced-motion rule and the
 * check below).
 */
export function GearLoader({ label = "Alchemica", delayMs = 200 }: { label?: string; delayMs?: number }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setLine((n) => (n + 1) % LINES.length), 700);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        minHeight: "55vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        opacity: 0,
        animation: `loader-in 0.3s ${delayMs}ms ease-out forwards`,
      }}
    >
      <Box sx={{ position: "relative", width: 132, height: 104, color: "primary.main" }}>
        {/* Speeds follow the tooth count (10 : 8) so the two gears mesh. */}
        <Gear d={BIG} size={88} spin="gear-spin 3s linear infinite" sx={{ left: 0, top: 16 }} />
        <Gear
          d={SMALL}
          size={60}
          spin="gear-spin-back 2.4s linear infinite"
          sx={{ left: 72, top: 0, color: "color-mix(in srgb, var(--color-accent) 70%, var(--color-foreground))" }}
        />
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{label}</Typography>
      <Typography aria-hidden sx={{ fontSize: 13, color: "text.secondary", minHeight: 20 }}>
        {LINES[line]}…
      </Typography>
      <Box aria-hidden sx={{ width: 180, height: 3, borderRadius: 999, bgcolor: "var(--fill-track)", overflow: "hidden" }}>
        <Box sx={{ width: "40%", height: "100%", borderRadius: 999, bgcolor: "primary.main", animation: "loader-slide 1.1s ease-in-out infinite" }} />
      </Box>
    </Box>
  );
}
