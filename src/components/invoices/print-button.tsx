"use client";

import Button from "@mui/material/Button";

export function PrintButton() {
  return (
    <Button
      variant="contained"
      onClick={() => window.print()}
      sx={{ "@media print": { display: "none" } }}
    >
      Save as PDF
    </Button>
  );
}
