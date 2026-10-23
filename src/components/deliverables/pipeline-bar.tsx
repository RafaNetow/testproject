"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useRevealed } from "@/components/shared/motion";
import { CountUp } from "@/components/shared/count-up";
import { figureSx } from "@/lib/palette";

export type PipelineStep = { key: string; label: string; count: number; color: string };

/**
 * Where the deliverables stand, as one segmented bar (draft → in progress →
 * awaiting the client → changes → approved). The segments widen in from zero
 * once the page loader lifts; the legend counts up.
 */
export function PipelineBar({ steps, title = "Where the work stands" }: { steps: PipelineStep[]; title?: string }) {
  const revealed = useRevealed();
  const total = steps.reduce((n, s) => n + s.count, 0);
  if (!total) return null;
  const done = steps.find((s) => s.key === "approved")?.count ?? 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ ...figureSx, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          <CountUp value={done} /> of {total} approved
        </Typography>
      </Box>
      <Box
        role="img"
        aria-label={steps.filter((s) => s.count).map((s) => `${s.label}: ${s.count}`).join(", ")}
        sx={{ display: "flex", gap: "3px", height: 12, borderRadius: 999, overflow: "hidden", bgcolor: "var(--fill-neutral)" }}
      >
        {steps
          .filter((s) => s.count > 0)
          .map((s, i) => (
            <Box
              key={s.key}
              sx={{
                flexGrow: revealed ? s.count : 0,
                flexBasis: 0,
                minWidth: revealed ? 6 : 0,
                bgcolor: s.color,
                transition: `flex-grow 900ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 90}ms, min-width 900ms`,
              }}
            />
          ))}
      </Box>
      <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", columnGap: 2.5, rowGap: 0.75 }}>
        {steps
          .filter((s) => s.count > 0)
          .map((s) => (
            <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color }} />
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {s.label} <Box component="span" sx={{ ...figureSx, fontWeight: 700, color: "text.primary" }}>{s.count}</Box>
              </Typography>
            </Box>
          ))}
      </Box>
    </Paper>
  );
}
