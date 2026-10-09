"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import Close from "@mui/icons-material/Close";

/**
 * Slide-over panel for everything that isn't "look at the client's active
 * work": editing the client record, managing team invites, and the
 * delete-client action. Keeps the main page focused on projects/engagements
 * — the thing an admin actually opens this page to see.
 */
export function ClientSettingsDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        title="Client settings"
        aria-label="Open client settings"
        sx={{ border: "1px solid rgb(145 158 171 / 0.32)", borderRadius: 2 }}
      >
        <SettingsOutlined sx={{ fontSize: 18 }} />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: "100%", maxWidth: 448, borderRadius: 0 } } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            px: 3,
            py: 2.5,
          }}
        >
          <Typography variant="h2" sx={{ fontSize: 18 }}>
            Client settings
          </Typography>
          <IconButton size="small" aria-label="Close settings" onClick={() => setOpen(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>{children}</Box>
      </Drawer>
    </>
  );
}
