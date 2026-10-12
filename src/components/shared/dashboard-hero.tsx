"use client";

import { useSyncExternalStore } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MolecularAccent } from "@/components/molecular-accent";
import { figureSx } from "@/lib/palette";

const noSubscription = () => () => {};

function dateLabelNow() {
  return new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * The dashboard's opening card: where the engagement stands, not a greeting.
 * Content comes from the server; only the date uses the visitor's own clock
 * (rendered empty on the server, filled in after hydration, no mismatch).
 */
export function DashboardHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const dateLabel = useSyncExternalStore(noSubscription, dateLabelNow, () => "");

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        color: "text.primary",
        bgcolor: "color-mix(in srgb, var(--color-accent) 5%, var(--color-card))",
        boxShadow: "var(--shadow-card)",
        // Faint graph-paper grid, like a lab notebook page, fading out to the left.
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--color-accent) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 9%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(90deg, transparent 15%, black 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, left: "45%", display: { xs: "none", md: "block" } }}>
        <MolecularAccent particleCount={36} opacity={0.9} />
      </Box>
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
        <Typography sx={{ ...figureSx, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "primary.main" }}>
          {eyebrow}
          <Box component="span" sx={{ color: "text.muted", fontWeight: 500 }}>
            {dateLabel ? ` · ${dateLabel}` : ""}
          </Box>
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 24, sm: 30 } }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 1.5, fontSize: 15, lineHeight: 1.6, color: "text.secondary" }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}
