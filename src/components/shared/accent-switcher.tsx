"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, Palette } from "@/components/icons";
import { ACCENTS, ACCENT_COOKIE, type AccentKey } from "@/lib/accents";

function currentAccent(): AccentKey {
  if (typeof document === "undefined") return "verdigris";
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
 * Pick the accent colour for your own view, live. The choice is a cookie on this
 * browser (portal and marketing pages follow it); nobody else is affected.
 */
export function AccentSwitcher({ surface = "admin" }: { surface?: "portal" | "admin" }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [accent, setAccent] = useState<AccentKey>("verdigris");

  function choose(key: AccentKey) {
    applyAccent(key);
    setAccent(key);
  }

  return (
    <>
      <Tooltip title={surface === "admin" ? "Compare brand colours" : "Choose a colour"}>
        <IconButton
          aria-label={surface === "admin" ? "Compare brand colours" : "Choose a colour"}
          aria-haspopup="dialog"
          onClick={(e) => {
            setAccent(currentAccent());
            setAnchor(e.currentTarget);
          }}
        >
          <Palette sx={{ fontSize: 22 }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 280, p: 1.5, mt: 1, borderRadius: 2 } } }}
      >
        <Typography sx={{ px: 1, pt: 0.5, fontSize: 14, fontWeight: 700 }}>Brand colour</Typography>
        <Typography sx={{ px: 1, pb: 1, fontSize: 12, color: "text.muted" }}>
          {surface === "admin" ? "Comparing colours — only you see this." : "Choose the colour you prefer — it only changes your view."}
        </Typography>
        <Box role="radiogroup" aria-label="Brand colour" sx={{ display: "grid", gap: 0.5 }}>
          {ACCENTS.map((a) => {
            const selected = a.key === accent;
            return (
              <ButtonBase
                key={a.key}
                role="radio"
                aria-checked={selected}
                onClick={() => choose(a.key)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  borderRadius: 1.5,
                  textAlign: "left",
                  justifyContent: "flex-start",
                  bgcolor: selected ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: "50%", bgcolor: a.swatch, color: "#fff" }}
                >
                  {selected && <Check sx={{ fontSize: 16 }} />}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{a.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.muted" }}>{a.note}</Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
