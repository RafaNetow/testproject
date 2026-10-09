"use client";

import Button from "@mui/material/Button";
import Download from "@mui/icons-material/Download";

export function PrintButton() {
  return (
    <Button
      variant="contained"
      startIcon={<Download />}
      onClick={() => window.print()}
      sx={{ "@media print": { display: "none" } }}
    >
      Save as PDF
    </Button>
  );
}
