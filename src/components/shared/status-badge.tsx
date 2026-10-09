import Box from "@mui/material/Box";

type Tone = "success" | "info" | "warning" | "error" | "default";

const STATUS_TONES: Record<string, Tone> = {
  onboarding: "info",
  active: "success",
  at_risk: "warning",
  offboarded: "default",
  paused: "warning",
  completed: "default",
  sent: "info",
  draft: "default",
  in_progress: "info",
  in_review: "warning",
  changes_requested: "error",
  approved: "success",
  overdue: "error",
  paid: "success",
  signed: "success",
  partially_signed: "warning",
  upcoming: "info",
  past: "default",
  cancelled: "error",
};

/** Soft-tinted background + darker text of the same hue, per scheme. */
const TONE_COLORS: Record<Tone, { bg: string; text: string }> = {
  success: { bg: "rgb(34 197 94 / 0.16)", text: "light-dark(#118d57, #77ed8b)" },
  info: { bg: "rgb(0 184 217 / 0.16)", text: "light-dark(#006c9c, #61f3f3)" },
  warning: { bg: "rgb(255 171 0 / 0.16)", text: "light-dark(#b76e00, #ffd666)" },
  error: { bg: "rgb(255 86 48 / 0.16)", text: "light-dark(#b71d18, #ffac82)" },
  default: { bg: "rgb(145 158 171 / 0.16)", text: "light-dark(#637381, #919eab)" },
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
  const colors = TONE_COLORS[STATUS_TONES[status] ?? "default"];
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
