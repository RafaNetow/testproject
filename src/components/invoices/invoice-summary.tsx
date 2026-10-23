import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { DonutChart } from "@/components/charts/charts";
import { CountUp } from "@/components/shared/count-up";
import { figureSx } from "@/lib/palette";
import type { InvoiceTotals } from "@/lib/due";

const ROWS = [
  { key: "paid", label: "Paid", token: "--color-accent" },
  { key: "outstanding", label: "Outstanding", token: "--color-muted-foreground" },
  { key: "overdue", label: "Overdue", token: "--color-error" },
] as const;

/**
 * The money at a glance: paid, outstanding and overdue totals counting up,
 * beside a ring of the three. Never mixes currencies (see invoiceTotals).
 */
export function InvoiceSummary({ totals }: { totals: InvoiceTotals }) {
  const all = totals.paid + totals.outstanding + totals.overdue;
  return (
    <Paper variant="outlined" sx={{ p: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 3, sm: 5 } }}>
      <DonutChart
        size={156}
        currency={totals.currency}
        label={`Invoices in ${totals.currency}: paid, outstanding and overdue`}
        slices={ROWS.map((r) => ({ id: r.key, label: r.label, value: totals[r.key], token: r.token }))}
        center={
          <Box>
            <Typography sx={{ fontSize: 11, color: "text.muted" }}>Total</Typography>
            <Typography sx={{ ...figureSx, fontSize: 15, fontWeight: 700 }}>
              <CountUp value={all} currency={totals.currency} />
            </Typography>
          </Box>
        }
      />
      <Box sx={{ flex: 1, minWidth: 220, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        {ROWS.map((r) => (
          <Box key={r.key}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: `var(${r.token})` }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>{r.label}</Typography>
            </Box>
            <Typography sx={{ ...figureSx, mt: 0.5, fontSize: 22, fontWeight: 700, color: r.key === "overdue" && totals.overdue > 0 ? "error.main" : "text.primary" }}>
              <CountUp value={totals[r.key]} currency={totals.currency} delay={350} />
            </Typography>
          </Box>
        ))}
        {totals.others.length > 0 && (
          <Typography sx={{ gridColumn: "1 / -1", fontSize: 12, color: "text.muted" }}>
            Totals in {totals.currency}. Invoices in {totals.others.join(", ")} are listed below and not added in.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
