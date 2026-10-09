"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const DOT_COLORS: Record<string, string> = {
  onboarding: "#38bdf8",
  active: "#34d399",
  at_risk: "#fbbf24",
  offboarded: "#94a3b8",
  paused: "#fbbf24",
  completed: "#94a3b8",
  sent: "#38bdf8",
  draft: "#94a3b8",
  in_progress: "#38bdf8",
  in_review: "#fbbf24",
  changes_requested: "#fb923c",
  approved: "#34d399",
  overdue: "#f87171",
  paid: "#34d399",
  signed: "#34d399",
  partially_signed: "#fbbf24",
  upcoming: "#38bdf8",
  past: "#94a3b8",
  cancelled: "#f87171",
};

/**
 * A dot + label pill — the pattern used by Linear/Vercel/Stripe-style
 * dashboards — instead of a flat tinted-background pill, which reads as
 * dated and relies on colour alone to carry meaning.
 */
export function StatusBadge({
  status,
  label,
  tone = "light",
}: {
  status: string;
  label?: string;
  tone?: "light" | "dark";
}) {
  const dot = DOT_COLORS[status] ?? "#94a3b8";
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }} />}
      label={(label ?? status).replaceAll("_", " ")}
      sx={{
        height: 22,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        ...(tone === "dark"
          ? { borderColor: "rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }
          : { borderColor: "divider", bgcolor: "background.paper", color: "text.secondary" }),
        "& .MuiChip-icon": { ml: 1, mr: -0.25 },
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}
