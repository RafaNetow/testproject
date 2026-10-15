"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Portal from "@mui/material/Portal";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AccessTime from "@mui/icons-material/AccessTime";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import DoneAll from "@mui/icons-material/DoneAll";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import WorkOutlineOutlined from "@mui/icons-material/WorkOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { createClient } from "@/lib/supabase/client";
import { STATUS_TONE, category, type Tone } from "@/lib/palette";
import { timeAgo } from "@/lib/time-ago";
import { markNotificationsRead } from "@/lib/actions/notifications";
import {
  notificationHref,
  type NotificationRow,
} from "@/lib/notification-links";

export type NotificationItem = {
  id: string;
  message: string;
  kind: string;
  href: string;
  read: boolean;
  created_at: string;
};

/**
 * One mapping, from the shared colour standard (src/lib/palette.ts): the
 * engagement's own work in the brand primary, money in success, things that
 * may need the reader's attention in warning, the rest in category colours.
 */
const KIND_ICONS: Record<string, { icon: SvgIconComponent; tone: Tone }> = {
  card: { icon: ViewKanbanOutlined, tone: STATUS_TONE.primary },
  update: { icon: EditNoteOutlined, tone: STATUS_TONE.primary },
  project: { icon: WorkOutlineOutlined, tone: STATUS_TONE.primary },
  client: { icon: BusinessOutlined, tone: STATUS_TONE.primary },
  deliverable: { icon: Inventory2Outlined, tone: STATUS_TONE.warning },
  contract: { icon: DescriptionOutlined, tone: STATUS_TONE.warning },
  invoice: { icon: ReceiptLongOutlined, tone: STATUS_TONE.success },
  file: { icon: FolderOpenOutlined, tone: category(0) },
  meeting: { icon: VideocamOutlined, tone: category(4) },
  decision: { icon: ForumOutlined, tone: category(3) },
  hours: { icon: AccessTimeOutlined, tone: STATUS_TONE.neutral },
  team: { icon: GroupsOutlined, tone: category(3) },
  prospect: { icon: TrackChangesOutlined, tone: STATUS_TONE.neutral },
};

/**
 * The header bell. Starts from the server-rendered list, then listens for new
 * rows over Supabase Realtime so activity from other people shows up — with a
 * toast — without a page reload.
 */
export function NotificationBell({
  notifications,
  surface,
  userId,
}: {
  notifications: NotificationItem[];
  surface: "portal" | "admin";
  userId: string;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState(notifications);
  const [toast, setToast] = useState<NotificationItem | null>(null);

  // A navigation re-renders the layout with a fresh server list; adopt it.
  const [serverList, setServerList] = useState(notifications);
  if (serverList !== notifications) {
    setServerList(notifications);
    setItems(notifications);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Realtime checks Row-Level Security with the socket's token. The session
    // lives in cookies and loads lazily, so hand it to Realtime explicitly
    // before subscribing — otherwise the socket joins as anon and receives
    // nothing.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session)
        await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as NotificationRow;
            const item: NotificationItem = {
              id: row.id,
              message: row.message,
              kind: row.kind,
              href: notificationHref(row, surface),
              read: false,
              created_at: row.created_at,
            };
            setItems((prev) =>
              prev.some((n) => n.id === item.id)
                ? prev
                : [item, ...prev].slice(0, 30),
            );
            setToast(item);
          },
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`Live notifications unavailable (${status})`, err?.message ?? "");
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, surface]);

  const unread = items.filter((n) => !n.read);

  function markRead(ids: string[]) {
    if (ids.length === 0) return;
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    );
    void markNotificationsRead(ids);
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={
          unread.length > 0
            ? `Notifications, ${unread.length} unread`
            : "Notifications"
        }
      >
        <Badge badgeContent={unread.length} color="error" max={99}>
          <NotificationsNoneOutlined sx={{ fontSize: 22 }} />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { mt: 1, width: 380, maxWidth: "calc(100vw - 32px)" } },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", px: 2.5, py: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Notifications
            </Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {unread.length > 0
                ? `You have ${unread.length} unread`
                : "You're all caught up"}
            </Typography>
          </Box>
          {unread.length > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton
                onClick={() => markRead(unread.map((n) => n.id))}
                aria-label="Mark all as read"
                sx={{ color: "primary.main" }}
              >
                <DoneAll sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Divider sx={{ borderStyle: "dashed" }} />

        {items.length === 0 ? (
          <Typography
            sx={{
              px: 2.5,
              py: 5,
              textAlign: "center",
              fontSize: 14,
              color: "text.muted",
            }}
          >
            No notifications yet.
          </Typography>
        ) : (
          <List disablePadding sx={{ maxHeight: 440, overflowY: "auto" }}>
            {items.map((n) => {
              const { icon: KindIcon, tone } =
                KIND_ICONS[n.kind] ?? KIND_ICONS.card;
              return (
                <ListItemButton
                  key={n.id}
                  component={Link}
                  href={n.href}
                  onClick={() => {
                    markRead([n.id]);
                    setAnchor(null);
                  }}
                  sx={{
                    alignItems: "flex-start",
                    gap: 0.5,
                    px: 2.5,
                    py: 1.5,
                    borderBottom: "1px dashed var(--border-dashed)",
                    bgcolor: n.read
                      ? undefined
                      : "color-mix(in srgb, var(--color-accent) 6%, transparent)",
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 52 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: tone.bg,
                        color: tone.text,
                      }}
                    >
                      <KindIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={n.message}
                    secondary={
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <AccessTime sx={{ fontSize: 14 }} />
                        {timeAgo(n.created_at)}
                      </Box>
                    }
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 14,
                          fontWeight: n.read ? 400 : 600,
                          color: "text.primary",
                          lineHeight: 1.5,
                        },
                      },
                      secondary: {
                        sx: { mt: 0.5, fontSize: 12, color: "text.muted" },
                      },
                    }}
                  />
                  {!n.read && (
                    <Box
                      aria-label="Unread"
                      sx={{
                        mt: 1,
                        width: 8,
                        height: 8,
                        flexShrink: 0,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Popover>

      {/* Portaled: the header's backdrop-filter would otherwise trap this fixed toast inside it. */}

      <Portal>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setToast(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast(null)}
          icon={<NotificationsNoneOutlined fontSize="inherit" />}
          severity="info"
          variant="filled"
          sx={{
            width: "100%",
            maxWidth: 420,
            bgcolor: "var(--inverse-surface)",
            color: "var(--inverse-foreground)",
            "& .MuiAlert-icon, & .MuiAlert-action": { color: "inherit" },
            boxShadow: "var(--shadow-dropdown)",
          }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
      </Portal>
    </>
  );
}
