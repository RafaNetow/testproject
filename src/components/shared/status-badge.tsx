import Box from "@mui/material/Box";
import { STATUS_TONE } from "@/lib/palette";

type Tone = "success" | "info" | "warning" | "error" | "neutral";

const STATUS_TONES: Record<string, Tone> = {
  onboarding: "info",
  active: "success",
  at_risk: "warning",
  offboarded: "neutral",
  paused: "warning",
  completed: "neutral",
  sent: "info",
  draft: "neutral",
  in_progress: "info",
  in_review: "warning",
  changes_requested: "error",
  approved: "success",
  overdue: "error",
  paid: "success",
  signed: "success",
  partially_signed: "warning",
  upcoming: "info",
  past: "neutral",
  cancelled: "error",
};


/** The "soft label" used by Minimal-style dashboards for every status. */
export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
  /** @deprecated Headers are light now; kept so existing call sites compile. */
  tone?: "light" | "dark";
}) {
  const colors = STATUS_TONE[STATUS_TONES[status] ?? "neutral"];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        height: 24,
        minWidth: 24,
        px: 0.75,
        borderRadius: 0.75,
        bgcolor: colors.bg,
        color: colors.text,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        textTransform: "capitalize",
      }}
    >
      {(label ?? status).replaceAll("_", " ")}
    </Box>
  );
}
