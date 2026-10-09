"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import { timeAgo } from "@/lib/time-ago";
import { markNotificationsRead } from "@/lib/actions/notifications";

export type NotificationItem = {
  id: string;
  message: string;
  href: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell({
  notifications,
  dark,
}: {
  notifications: NotificationItem[];
  dark?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.read).map((n) => n.id))
  );
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  function markAllRead() {
    const unread = notifications.filter((n) => !readIds.has(n.id)).map((n) => n.id);
    if (unread.length === 0) return;
    setReadIds((prev) => new Set([...prev, ...unread]));
    void markNotificationsRead(unread);
  }

  return (
    <>
      <IconButton
        onClick={(e) => {
          setAnchor(e.currentTarget);
          markAllRead();
        }}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        sx={
          dark
            ? { color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }
            : { color: "text.secondary" }
        }
      >
        <Badge color="error" variant="dot" invisible={unreadCount === 0} overlap="circular">
          <NotificationsNoneOutlined sx={{ fontSize: 20 }} />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            variant: "outlined",
            sx: { mt: 1, width: 320, maxHeight: 384, borderRadius: 3, boxShadow: 6 },
          },
        }}
      >
        {notifications.length === 0 ? (
          <Typography sx={{ px: 2, py: 3, textAlign: "center", fontSize: 14, color: "text.muted" }}>
            No notifications yet.
          </Typography>
        ) : (
          <List disablePadding>
            {notifications.map((n) => (
              <ListItemButton
                key={n.id}
                component={Link}
                href={n.href}
                onClick={() => setAnchor(null)}
                divider
                sx={{ alignItems: "flex-start", bgcolor: n.read ? undefined : "action.selected" }}
              >
                <ListItemText
                  primary={n.message}
                  secondary={timeAgo(n.created_at)}
                  slotProps={{
                    primary: { sx: { fontSize: 14, color: "text.primary" } },
                    secondary: { sx: { fontSize: 12, color: "text.muted" } },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
