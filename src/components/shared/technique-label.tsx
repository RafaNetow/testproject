"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { categorical } from "@/lib/palette";
import { isFileLabel, LABEL_HINTS } from "@/lib/techniques";

/** The technique / document-kind label, in its stable category colour, with a plain-language hint. */
export function TechniqueLabel({ label, size = "md" }: { label: string | null; size?: "sm" | "md" }) {
  if (!label) return <Typography sx={{ fontSize: 13, color: "text.muted" }}>—</Typography>;
  const tone = categorical(label);
  const hint = isFileLabel(label) ? LABEL_HINTS[label] : undefined;
  const chip = (
    <Box
      component="span"
      tabIndex={hint ? 0 : undefined}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: size === "sm" ? 20 : 24,
        px: size === "sm" ? 0.75 : 1,
        borderRadius: 0.75,
        bgcolor: tone.bg,
        color: tone.text,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        cursor: hint ? "help" : undefined,
      }}
    >
      {label}
    </Box>
  );
  return hint ? (
    <Tooltip title={hint} arrow describeChild>
      {chip}
    </Tooltip>
  ) : (
    chip
  );
}
