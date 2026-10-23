"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { CountUp } from "@/components/shared/count-up";
import { useReducedMotion, useRevealed, useTokenColors } from "@/components/shared/motion";
import { formatMoney } from "@/lib/money";
import { figureSx } from "@/lib/palette";

/**
 * The portal's charts, on MUI X Charts. Each one mounts its data once the page
 * loader has lifted, so its own entrance animation plays in view; with reduce
 * motion (system or Settings) the chart appears complete. Colours are the
 * portal's tokens (`--color-accent`, `--color-warning`…), read at runtime so
 * they follow the chosen accent and dark mode.
 */

const tooltipValue = (currency?: string, unit?: string) => (v: number | null) =>
  v === null ? "" : currency ? formatMoney(v, currency, { whole: true }) : `${Math.round(v * 10) / 10}${unit ? ` ${unit}` : ""}`;

export type DonutSlice = { id: string; label: string; value: number; token: string };

/** A ring chart with something in the middle (usually the total). */
export function DonutChart({
  slices,
  size = 168,
  center,
  currency,
  label,
}: {
  slices: DonutSlice[];
  size?: number;
  center?: ReactNode;
  /** Values are cents in this currency (for tooltips). */
  currency?: string;
  label: string;
}) {
  const revealed = useRevealed();
  const reduce = useReducedMotion();
  const colors = useTokenColors(Object.fromEntries(slices.map((s) => [s.id, s.token])) as Record<string, string>);
  const data = slices.filter((s) => s.value > 0);

  return (
    <Box role="img" aria-label={label} sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {revealed && colors && data.length > 0 && (
        <PieChart
          width={size}
          height={size}
          hideLegend
          skipAnimation={reduce}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          series={[
            {
              data: data.map((s) => ({ id: s.id, value: s.value, label: s.label, color: colors[s.id] })),
              innerRadius: size * 0.33,
              outerRadius: size / 2 - 4,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
              valueFormatter: (item) => tooltipValue(currency)(item.value),
            },
          ]}
        />
      )}
      {center && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>{center}</Box>
      )}
    </Box>
  );
}

export type BarSeries = { id: string; label: string; data: number[]; token: string };

/** Bars per week (or any category), optionally stacked. */
export function WeeklyBars({
  labels,
  series,
  stacked = false,
  height = 240,
  unit,
  currency,
  label,
}: {
  labels: string[];
  series: BarSeries[];
  stacked?: boolean;
  height?: number;
  unit?: string;
  currency?: string;
  label: string;
}) {
  const revealed = useRevealed();
  const reduce = useReducedMotion();
  const colors = useTokenColors(Object.fromEntries(series.map((s) => [s.id, s.token])) as Record<string, string>);

  return (
    <Box role="img" aria-label={label} sx={{ width: "100%", height }}>
      {revealed && colors && (
        <BarChart
          height={height}
          skipAnimation={reduce}
          borderRadius={4}
          grid={{ horizontal: true }}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          xAxis={[{ scaleType: "band", data: labels, tickLabelStyle: { fontSize: 11 } }]}
          yAxis={[{ tickLabelStyle: { fontSize: 11 }, width: currency ? 70 : 32, valueFormatter: currency ? (v: number) => formatMoney(v, currency, { whole: true }) : undefined }]}
          series={series.map((s) => ({
            id: s.id,
            label: s.label,
            data: s.data,
            color: colors[s.id],
            ...(stacked ? { stack: "total" } : {}),
            valueFormatter: tooltipValue(currency, unit),
          }))}
          sx={{ "& .MuiChartsGrid-line": { stroke: "var(--border-outline)" } }}
        />
      )}
    </Box>
  );
}

/** A filled line over time. */
export function TrendLine({ labels, data, token = "--color-accent", height = 220, label }: { labels: string[]; data: number[]; token?: string; height?: number; label: string }) {
  const revealed = useRevealed();
  const reduce = useReducedMotion();
  const colors = useTokenColors({ line: token });

  return (
    <Box role="img" aria-label={label} sx={{ width: "100%", height }}>
      {revealed && colors && (
        <LineChart
          height={height}
          skipAnimation={reduce}
          hideLegend
          grid={{ horizontal: true }}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 11 } }]}
          yAxis={[{ tickLabelStyle: { fontSize: 11 }, width: 32 }]}
          series={[{ data, color: colors.line, area: true, showMark: false, curve: "monotoneX" }]}
          sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.15 }, "& .MuiChartsGrid-line": { stroke: "var(--border-outline)" } }}
        />
      )}
    </Box>
  );
}

/** A half-ring gauge with the % counting up in the middle. */
export function GaugeMeter({ value, size = 160, caption, label }: { value: number; size?: number; caption?: string; label: string }) {
  const revealed = useRevealed();
  const target = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <Box role="img" aria-label={label} sx={{ position: "relative", width: size, height: size * 0.72, flexShrink: 0 }}>
      <Gauge
        width={size}
        height={size * 0.72}
        value={revealed ? target : 0}
        valueMax={100}
        startAngle={-110}
        endAngle={110}
        innerRadius="76%"
        outerRadius="100%"
        cornerRadius="50%"
        text={() => ""}
        sx={{
          [`& .${gaugeClasses.valueArc}`]: { fill: "var(--color-accent)" },
          [`& .${gaugeClasses.referenceArc}`]: { fill: "var(--fill-neutral)" },
        }}
      />
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 4, textAlign: "center", pointerEvents: "none" }}>
        <Typography sx={{ ...figureSx, fontSize: Math.round(size * 0.18), fontWeight: 700, lineHeight: 1 }}>
          <CountUp value={target} suffix="%" />
        </Typography>
        {caption && <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.secondary" }}>{caption}</Typography>}
      </Box>
    </Box>
  );
}
