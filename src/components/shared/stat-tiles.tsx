import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export type StatTile = { label: string; value: string | number; hint?: string; tone?: "error"; icon?: ReactNode };

/** Each tile gets its own hue, Minimal "widget summary" style. */
const HUES = ["var(--color-accent)", "#8e33ff", "#ffab00", "#ff5630"];

/** A row of headline numbers — client count, open items, next meeting… */
export function StatTiles({
  tiles,
  columns = 4,
  compact,
}: {
  tiles: StatTile[];
  columns?: 2 | 3 | 4;
  /** Smaller value type, for long values like multi-currency totals. */
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: {
          xs: columns === 4 && !compact ? "repeat(2, 1fr)" : "1fr",
          sm: columns === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          lg: `repeat(${columns}, 1fr)`,
        },
      }}
    >
      {tiles.map((tile, i) => {
        const hue = tile.tone === "error" ? "#ff5630" : HUES[i % HUES.length];
        return (
          <Paper
            key={tile.label}
            sx={{
              position: "relative",
              overflow: "hidden",
              p: 3,
              background: `linear-gradient(135deg, color-mix(in srgb, ${hue} 8%, var(--color-card)), color-mix(in srgb, ${hue} 20%, var(--color-card)))`,
              transition: "transform 200ms",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            {tile.icon && (
              <Box
                sx={{
                  mb: 2,
                  display: "grid",
                  placeItems: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  bgcolor: `color-mix(in srgb, ${hue} 18%, transparent)`,
                  color: hue,
                  "& svg": { fontSize: 24 },
                }}
              >
                {tile.icon}
              </Box>
            )}
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.secondary" }}>{tile.label}</Typography>
            <Typography
              sx={{
                mt: 0.75,
                fontSize: compact ? 22 : 28,
                fontWeight: 700,
                lineHeight: 1.3,
                color: tile.tone === "error" ? "error.main" : "text.primary",
              }}
            >
              {tile.value}
            </Typography>
            {tile.hint && <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>{tile.hint}</Typography>}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                right: -24,
                top: -24,
                width: 96,
                height: 96,
                borderRadius: "50%",
                bgcolor: `color-mix(in srgb, ${hue} 10%, transparent)`,
              }}
            />
          </Paper>
        );
      })}
    </Box>
  );
}
