import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/** Dashed placeholder card for "nothing here yet" states. */
export function EmptyState({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderStyle: "dashed", px: 3, py: 8, textAlign: "center" }}>
      <Typography variant="h6" component="p" sx={{ fontSize: 18 }}>
        {title}
      </Typography>
      {children && (
        <Typography sx={{ mt: 0.75, fontSize: 14, color: "text.muted" }}>{children}</Typography>
      )}
    </Paper>
  );
}
