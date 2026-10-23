"use client";

import Chip from "@mui/material/Chip";
import Grow from "@mui/material/Grow";
import { STATUS_TONE } from "@/lib/palette";
import { dueLabel } from "@/lib/due";
import { useRevealed } from "@/components/shared/motion";

/**
 * "Due in 3 days" / "Overdue 2 days" as a small MUI Chip that grows in once
 * the page loader lifts. Overdue chips pulse softly so they're noticed;
 * within two days they turn amber.
 */
export function DueChip({ days, sx }: { days: number; sx?: object }) {
  const revealed = useRevealed();
  const overdue = days < 0;
  const soon = !overdue && days <= 2;
  const tone = overdue ? STATUS_TONE.error : soon ? STATUS_TONE.warning : STATUS_TONE.neutral;
  return (
    <Grow in={revealed} style={{ transformOrigin: "left center" }} timeout={450}>
      <Chip
        size="small"
        label={dueLabel(days)}
        className={overdue ? "due-pulse" : undefined}
        sx={{ height: 22, fontSize: 12, fontWeight: 700, bgcolor: tone.bg, color: tone.text, ...sx }}
      />
    </Grow>
  );
}
