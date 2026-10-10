import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import { STATUS_TONE } from "@/lib/palette";

/** Placeholder card for "nothing here yet" states, with a flask by default. */
export function EmptyState({ title, children, icon }: { title: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderStyle: "dashed", px: 3, py: 7, textAlign: "center" }}>
      <Box
        sx={{
          mx: "auto",
          mb: 2,
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          bgcolor: STATUS_TONE.primary.bg,
          color: "primary.main",
          "& svg": { fontSize: 28 },
        }}
      >
        {icon ?? <ScienceOutlined />}
      </Box>
      <Typography variant="h6" component="p" sx={{ fontSize: 18 }}>
        {title}
      </Typography>
      {children && <Typography sx={{ mt: 0.75, fontSize: 14, color: "text.muted" }}>{children}</Typography>}
    </Paper>
  );
}
