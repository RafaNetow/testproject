"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SendOutlined from "@mui/icons-material/SendOutlined";
import { resendInvite } from "./actions";

export function ResendInviteButton({ orgId, email }: { orgId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ emailSent: boolean; message?: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await resendInvite(orgId, email));
    });
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {result && (
        <Typography
          role="status"
          sx={{ fontSize: 12, color: result.emailSent ? "success.main" : "warning.main" }}
        >
          {result.emailSent ? "Sent" : result.message}
        </Typography>
      )}
      <Tooltip title="Resend invite">
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            disabled={isPending}
            aria-label={`Resend invite to ${email}`}
            sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
          >
            <SendOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
