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
 * Greeting and date come from the visitor's own clock. The server renders a
 * neutral placeholder (it doesn't know the visitor's time of day), and the
 * client snapshot replaces it after hydration without a mismatch.
 */
export function DashboardHero({ name, subtitle }: { name?: string; subtitle: string }) {
  const greeting = useSyncExternalStore(noSubscription, greetingNow, () => "Welcome back");
  const dateLabel = useSyncExternalStore(noSubscription, dateLabelNow, () => "");

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        bgcolor: "#0a0e16",
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
      }}
    >
      <MolecularAccent tone="bright" particleCount={40} desktopOnly={false} opacity={0.6} />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            minHeight: "1.5em",
          }}
        >
          {dateLabel}
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 24, sm: 30 }, color: "#fff" }}>
          {greeting}
          {name ? `, ${name}` : ""}.
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}
