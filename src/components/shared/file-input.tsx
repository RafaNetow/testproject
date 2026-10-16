"use client";

import { useState, type ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AttachFile } from "@/components/icons";

/**
 * A file picker that looks like an MUI button but submits like a native
 * `<input type="file">` inside a server-action form. The input is visually
 * hidden (not display:none) so the browser can still flag it when required.
 */
export function FileInput({
  name,
  label,
  accept,
  required,
  size = "medium",
}: {
  name: string;
  label: string;
  accept?: string;
  required?: boolean;
  size?: "small" | "medium";
}) {
  const [chosen, setChosen] = useState("");

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="span" sx={{ display: "block", mb: 0.5, fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
        {label}
      </Typography>
      <Button
        component="label"
        variant="outlined"
        color="secondary"
        size={size}
        startIcon={<AttachFile />}
        sx={{ maxWidth: "100%", justifyContent: "flex-start" }}
      >
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {chosen || "Choose a file"}
        </Box>
        <Box
          component="input"
          type="file"
          name={name}
          accept={accept}
          required={required}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setChosen(e.target.files?.[0]?.name ?? "")}
          sx={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden", clip: "rect(0 0 0 0)" }}
        />
      </Button>
    </Box>
  );
}
