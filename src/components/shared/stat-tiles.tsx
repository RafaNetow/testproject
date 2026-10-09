import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export type StatTile = { label: string; value: string | number; hint?: string; tone?: "error" };

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
        gap: 2,
        gridTemplateColumns: {
          xs: columns === 4 && !compact ? "repeat(2, 1fr)" : "1fr",
          sm: columns === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          lg: `repeat(${columns}, 1fr)`,
        },
      }}
    >
      {tiles.map((tile) => (
        <Paper
          key={tile.label}
          variant="outlined"
          sx={{
            p: 2.5,
            transition: "transform 200ms, box-shadow 200ms",
            "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{tile.label}</Typography>
          <Typography
            sx={{
              mt: 1,
              fontFamily: "var(--font-display)",
              fontSize: compact ? 24 : 30,
              fontWeight: 500,
              color: tile.tone === "error" ? "error.main" : "text.primary",
            }}
          >
            {tile.value}
          </Typography>
          {tile.hint && <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.muted" }}>{tile.hint}</Typography>}
        </Paper>
      ))}
    </Box>
  );
}
