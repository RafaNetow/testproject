"use client";

import { useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, Close, SettingsOutlined } from "@/components/icons";
import { ACCENTS, ACCENT_COOKIE, type AccentKey } from "@/lib/accents";
import { MOTION_ATTR, setAnimationsEnabled } from "@/lib/motion-pref";

function currentAccent(): AccentKey {
  return (document.documentElement.dataset.accent as AccentKey | undefined) ?? "verdigris";
}

/** Applies the accent to the page and remembers it for the next load. */
function applyAccent(key: AccentKey) {
  const root = document.documentElement;
  if (key === "verdigris") {
    root.removeAttribute("data-accent");
    document.cookie = `${ACCENT_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-accent", key);
    document.cookie = `${ACCENT_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
  }
}

/**
 * The Settings button in the top bar — a slowly turning gear with a dot, as
 * on the Minimal dashboard — and the drawer it opens: the brand colour for
 * your own view, and animations on or off. Both are remembered on this
 * browser only; nobody else is affected.
 */
export function SettingsDrawer({ surface = "admin" }: { surface?: "portal" | "admin" }) {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<AccentKey>("verdigris");
  const [animations, setAnimations] = useState(true);

  function show() {
    setAccent(currentAccent());
    setAnimations(document.documentElement.getAttribute(MOTION_ATTR) !== "reduced");
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
            Motion
          </Typography>
          <FormControlLabel
            sx={{ mt: 1, mx: 0, width: "100%", justifyContent: "space-between" }}
            labelPlacement="start"
            label={
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Animations</Typography>
                <Typography sx={{ fontSize: 12, color: "text.muted" }}>Loaders, charts and counters that move. Off shows everything at once.</Typography>
              </Box>
            }
            control={
              <Switch
                checked={animations}
                onChange={(e) => {
                  setAnimationsEnabled(e.target.checked);
                  setAnimations(e.target.checked);
                }}
              />
            }
          />
        </Box>
      </Drawer>
    </>
  );
}
