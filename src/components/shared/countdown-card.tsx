"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { figureSx } from "@/lib/palette";

// A clock that ticks once a second, shared by every countdown on the page.
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);
const noTime = () => null;

function parts(seconds: number) {
  const s = Math.max(0, seconds);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * A live countdown to the next meeting or milestone: days, hours, minutes and
 * seconds in small instrument-style boxes. Time comes from the visitor's clock
 * after hydration (dashes on the server), so nothing mismatches.
 */
export function CountdownCard({
  eyebrow,
  title,
  at,
  icon,
  action,
  empty,
}: {
  eyebrow: string;
  title?: string;
  /** ISO instant to count down to; omit for the empty state. */
  at?: string | null;
  icon: ReactNode;
  action?: { label: string; href: string; external?: boolean };
  empty: string;
}) {
  const now = useSyncExternalStore(subscribe, nowSeconds, noTime);
  const target = at ? Math.floor(new Date(at).getTime() / 1000) : null;
  const left = target !== null && now !== null ? target - now : null;
  const p = left !== null ? parts(left) : null;
  const started = left !== null && left <= 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          aria-hidden
          sx={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: 1, flexShrink: 0, color: "primary.main", bgcolor: "color-mix(in srgb, var(--color-accent) 12%, transparent)", "& svg": { fontSize: 18 } }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>{eyebrow}</Typography>
      </Box>

      {target === null ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>{empty}</Typography>
      ) : (
        <>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 600 }} title={title}>
            {title}
          </Typography>
          {started ? (
            <Typography sx={{ ...figureSx, fontSize: 20, fontWeight: 700, color: "primary.main" }}>Starting now</Typography>
          ) : (
            <Box
              role="timer"
              aria-label={p ? `${p.d} days, ${p.h} hours and ${p.m} minutes to go` : "Counting down"}
              sx={{ display: "flex", gap: 0.75 }}
            >
              {(["d", "h", "m", "s"] as const).map((unit) => (
                <Box
                  key={unit}
                  aria-hidden
                  sx={{ flex: 1, minWidth: 0, py: 0.75, borderRadius: 1, textAlign: "center", bgcolor: "var(--fill-track)", border: 1, borderColor: "var(--border-outline)" }}
                >
                  <Typography sx={{ ...figureSx, fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: unit === "s" ? "primary.main" : "text.primary" }}>
                    {p ? String(p[unit]).padStart(2, "0") : "––"}
                  </Typography>
                  <Typography sx={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.muted" }}>
                    {{ d: "days", h: "hrs", m: "min", s: "sec" }[unit]}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {action && (
            <Button
              href={action.href}
              size="small"
              variant={started ? "contained" : "outlined"}
              color={started ? "primary" : "secondary"}
              {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
              sx={{ alignSelf: "flex-start", mt: 0.25 }}
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </Paper>
  );
}
