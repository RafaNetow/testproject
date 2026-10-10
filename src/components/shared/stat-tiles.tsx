import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { STATUS_TONE, figureSx } from "@/lib/palette";

export type StatTile = { label: string; value: string | number; hint?: string; tone?: "error"; icon?: ReactNode };

/**
 * A row of headline numbers — client count, open items, next meeting…
 * Deliberately one neutral tone: the number is the point, read like an
 * instrument readout. Colour appears only when it means something (`tone`).
 */
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
      {tiles.map((tile) => (
        <Paper key={tile.label} variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.secondary" }}>{tile.label}</Typography>
            {tile.icon && (
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: 1,
                  bgcolor: STATUS_TONE.primary.bg,
                  color: "primary.main",
                  "& svg": { fontSize: 20 },
                }}
              >
                {tile.icon}
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              ...figureSx,
              mt: 1.5,
              fontSize: compact ? 22 : 30,
              fontWeight: 600,
              lineHeight: 1.2,
              color: tile.tone === "error" ? STATUS_TONE.error.text : "text.primary",
            }}
          >
            {tile.value}
          </Typography>
          {tile.hint && <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary" }}>{tile.hint}</Typography>}
        </Paper>
      ))}
    </Box>
  );
}
