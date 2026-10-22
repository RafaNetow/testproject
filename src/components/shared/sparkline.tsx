import Box from "@mui/material/Box";

/**
 * A small trend line (with a soft area under it) for a stat tile. It draws
 * itself in on arrival (`.spark-line` / `.spark-area` in globals.css) and waits
 * for the page loader like the other entrances. Purely decorative: the tile's
 * number carries the meaning, so it's hidden from screen readers.
 */
export function Sparkline({ values, width = 120, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const pad = 3;
  const pts = values.map((v, i) => [i * step, height - pad - (v / max) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const area = `${line}L${width},${height}L0,${height}Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} aria-hidden sx={{ width, height, display: "block", overflow: "visible", color: "primary.main" }}>
      <path className="spark-area" d={area} fill="currentColor" opacity={0.12} />
      <path className="spark-line" d={line} pathLength={1} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle className="spark-dot" cx={lx} cy={ly} r={3} fill="currentColor" />
    </Box>
  );
}
