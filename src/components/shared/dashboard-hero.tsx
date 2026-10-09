"use client";

import { useSyncExternalStore } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MolecularAccent } from "@/components/molecular-accent";

const noSubscription = () => () => {};

function greetingNow() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function dateLabelNow() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/**
 * The dashboard's welcome card. Greeting and date come from the visitor's own
 * clock: the server renders a neutral placeholder (it doesn't know the
 * visitor's time of day) and the client snapshot replaces it after hydration
 * without a mismatch.
 */
export function DashboardHero({ name, subtitle }: { name?: string; subtitle: string }) {
  const greeting = useSyncExternalStore(noSubscription, greetingNow, () => "Welcome back");
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
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, var(--color-card)), color-mix(in srgb, var(--color-accent) 22%, var(--color-card)))",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, left: "45%", display: { xs: "none", md: "block" } }}>
        <MolecularAccent particleCount={36} opacity={0.9} />
      </Box>
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "primary.main", minHeight: "1.5em" }}>{dateLabel}</Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 24, sm: 30 } }}>
          {greeting}
          {name ? `, ${name}` : ""} 👋
        </Typography>
        <Typography sx={{ mt: 1.5, fontSize: 15, lineHeight: 1.6, color: "text.secondary" }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}
