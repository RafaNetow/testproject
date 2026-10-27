"use client";

import { useEffect, useState, type ReactNode } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, Close, DarkModeOutlined, LightModeOutlined, PlayArrow, SettingsOutlined, SystemModeOutlined } from "@/components/icons";
import { followSystemMode, getModeChoice, setModeChoice, type ModeChoice } from "@/lib/color-mode";
import { GearsMini } from "@/components/shared/gear-loader";
import { ACCENTS, ACCENT_COOKIE, DEFAULT_ACCENT, type AccentKey } from "@/lib/accents";
import { getMotionChoice, setMotionChoice, type MotionChoice } from "@/lib/motion-pref";
import { ROUTE_LOADING_ATTR } from "@/lib/route-loader";
import Button from "@mui/material/Button";
import { startTour } from "@/components/shared/onboarding-tour";

function currentAccent(): AccentKey {
  return (document.documentElement.dataset.accent as AccentKey | undefined) ?? DEFAULT_ACCENT;
}

/** Applies the accent to the page and remembers it for the next load. */
function applyAccent(key: AccentKey) {
  const root = document.documentElement;
  if (key === DEFAULT_ACCENT) {
    root.removeAttribute("data-accent");
    document.cookie = `${ACCENT_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-accent", key);
    document.cookie = `${ACCENT_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
  }
}

const MODE_OPTIONS: { key: ModeChoice; name: string; Icon: typeof LightModeOutlined }[] = [
  { key: "light", name: "Light", Icon: LightModeOutlined },
  { key: "dark", name: "Dark", Icon: DarkModeOutlined },
  { key: "system", name: "System", Icon: SystemModeOutlined },
];

/** The three loader choices, each with a tiny live preview. */
const MOTION_OPTIONS: { key: MotionChoice; name: string; note: string; preview: ReactNode }[] = [
  { key: "gears", name: "Gears", note: "Turning gears", preview: <GearsMini /> },
  {
    key: "bar",
    name: "Bar & messages",
    note: "Just the bar",
    preview: (
      <Box aria-hidden sx={{ display: "grid", gap: 0.75, justifyItems: "center" }}>
        <Box sx={{ width: 30, height: 4, borderRadius: 999, bgcolor: "var(--fill-neutral)" }} />
        <Box sx={{ width: 48, height: 4, borderRadius: 999, bgcolor: "var(--fill-track)", overflow: "hidden" }}>
          <Box sx={{ width: "40%", height: "100%", borderRadius: 999, bgcolor: "primary.main", animation: "loader-slide 1.1s ease-in-out infinite" }} />
        </Box>
      </Box>
    ),
  },
  {
    key: "off",
    name: "Off",
    note: "Nothing moves",
    preview: (
      <Box aria-hidden sx={{ display: "flex", gap: 0.75 }}>
        <Box sx={{ width: 6, height: 20, borderRadius: 1, bgcolor: "text.muted" }} />
        <Box sx={{ width: 6, height: 20, borderRadius: 1, bgcolor: "text.muted" }} />
      </Box>
    ),
  },
];

/** Shows the page loader for a moment, as if changing page. */
function previewLoader() {
  const root = document.documentElement;
  root.setAttribute(ROUTE_LOADING_ATTR, "on");
  window.setTimeout(() => {
    if (root.getAttribute(ROUTE_LOADING_ATTR) !== "on") return;
    root.setAttribute(ROUTE_LOADING_ATTR, "leaving");
    window.setTimeout(() => {
      if (root.getAttribute(ROUTE_LOADING_ATTR) === "leaving") root.removeAttribute(ROUTE_LOADING_ATTR);
    }, 260);
  }, 1600);
}

/**
 * The Settings button in the top bar — a slowly turning gear with a dot, as
 * on the Minimal dashboard — and the drawer it opens: the brand colour for
 * your own view, and the loading animation (gears, bar and messages, or off).
 * Both are remembered on this browser only; nobody else is affected.
 */
export function SettingsDrawer({ surface = "admin" }: { surface?: "portal" | "admin" }) {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<AccentKey>(DEFAULT_ACCENT);
  const [motion, setMotion] = useState<MotionChoice>("gears");
  const [mode, setMode] = useState<ModeChoice>("system");

  // On "System", follow the computer's light/dark setting live (the drawer is in every page's top bar).
  useEffect(() => followSystemMode(), []);

  function show() {
    setAccent(currentAccent());
    setMotion(getMotionChoice());
    setMode(getModeChoice());
    setOpen(true);
  }

  return (
    <>
      <Tooltip title="Settings">
        <IconButton aria-label="Settings" aria-haspopup="dialog" onClick={show}>
          <Badge color="primary" variant="dot" overlap="circular">
            {/* One slow turn every 8 seconds; it stands still with reduce motion. */}
            <SettingsOutlined sx={{ fontSize: 22, animation: "gear-spin 8s linear infinite" }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 340 } }, role: "dialog", "aria-label": "Settings" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 2 }}>
          <Typography sx={{ flex: 1, fontSize: 17, fontWeight: 700 }}>Settings</Typography>
          <IconButton aria-label="Close settings" onClick={() => setOpen(false)}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
            Mode
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: 12, color: "text.muted" }}>Light, dark, or follow your computer.</Typography>
          <Box role="radiogroup" aria-label="Mode" sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {MODE_OPTIONS.map((o) => {
              const selected = o.key === mode;
              return (
                <ButtonBase
                  key={o.key}
                  role="radio"
                  aria-checked={selected}
                  aria-label={o.name}
                  onClick={() => {
                    setModeChoice(o.key);
                    setMode(o.key);
                  }}
                  sx={{
                    flexDirection: "column",
                    gap: 0.75,
                    py: 1.5,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: selected ? "primary.main" : "var(--border-outline)",
                    bgcolor: selected ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "transparent",
                    color: selected ? "primary.main" : "text.secondary",
                    transition: "border-color 150ms, background-color 150ms",
                    "&:hover": { bgcolor: "action.hover" },
                    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
                  }}
                >
                  <o.Icon sx={{ fontSize: 24 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, color: "text.primary" }}>{o.name}</Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
        <Divider />

        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
            Colour
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: 12, color: "text.muted" }}>
            {surface === "admin" ? "Comparing colours — only you see this." : "Choose the colour you prefer — it only changes your view."}
          </Typography>
          <Box role="radiogroup" aria-label="Brand colour" sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {ACCENTS.map((a) => {
              const selected = a.key === accent;
              return (
                <ButtonBase
                  key={a.key}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${a.name}: ${a.note}`}
                  onClick={() => {
                    applyAccent(a.key);
                    setAccent(a.key);
                  }}
                  sx={{
                    flexDirection: "column",
                    gap: 0.75,
                    py: 1.5,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: selected ? a.swatch : "var(--border-outline)",
                    bgcolor: selected ? `color-mix(in srgb, ${a.swatch} 8%, transparent)` : "transparent",
                    transition: "border-color 150ms, background-color 150ms",
                    "&:hover": { bgcolor: "action.hover" },
                    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
                  }}
                >
                  <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: "50%", bgcolor: a.swatch, color: "#fff" }}>
                    {selected && <Check sx={{ fontSize: 16 }} />}
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, textAlign: "center", px: 0.5 }}>{a.name}</Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
        <Divider />

        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
            Loading animation
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: 12, color: "text.muted" }}>How pages load. Off also stops charts and counters from moving.</Typography>
          <Box role="radiogroup" aria-label="Loading animation" sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {MOTION_OPTIONS.map((o) => {
              const selected = o.key === motion;
              return (
                <ButtonBase
                  key={o.key}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${o.name}: ${o.note}`}
                  onClick={() => {
                    setMotionChoice(o.key);
                    setMotion(o.key);
                  }}
                  sx={{
                    flexDirection: "column",
                    gap: 1,
                    pt: 1.75,
                    pb: 1.25,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: selected ? "primary.main" : "var(--border-outline)",
                    bgcolor: selected ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "transparent",
                    transition: "border-color 150ms, background-color 150ms",
                    "&:hover": { bgcolor: "action.hover" },
                    "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
                  }}
                >
                  <Box sx={{ height: 34, display: "grid", placeItems: "center" }}>{o.preview}</Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, textAlign: "center", px: 0.75 }}>{o.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: "text.muted", lineHeight: 1.3, textAlign: "center", px: 0.5 }}>{o.note}</Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
          <Button
            size="small"
            color="secondary"
            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
            onClick={() => {
              // Close the drawer, then show the chosen loader for a moment.
              setOpen(false);
              window.setTimeout(previewLoader, 250);
            }}
            sx={{ mt: 1.25 }}
          >
            Preview
          </Button>
        </Box>
        <Divider />

        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
            Help
          </Typography>
          <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: 12, color: "text.muted" }}>A one-minute walk through every part of the portal.</Typography>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={() => {
              setOpen(false);
              // Let the drawer close before the spotlight starts.
              window.setTimeout(startTour, 250);
            }}
          >
            Take the tour
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
