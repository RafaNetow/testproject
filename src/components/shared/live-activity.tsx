"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time-ago";
import { notificationHref, type NotificationRow } from "@/lib/notification-links";
import { LinkBox } from "@/components/shared/link-box";

export type ActivityEntry = { id: string; message: string; href: string; created_at: string };

const MAX = 5;

// Relative times ("3m ago") refresh once a minute, from the visitor's clock.
function subscribeMinute(onTick: () => void) {
  const id = window.setInterval(onTick, 60_000);
  return () => window.clearInterval(id);
}
const nowMinute = () => Math.floor(Date.now() / 60_000);
const noTime = () => null;

/**
 * "Latest": the newest things that happened on the client's projects, live.
 * New notifications arrive over Supabase Realtime (scoped by RLS to this user)
 * and slide in at the top; a pulsing dot shows the feed is live.
 */
export function LiveActivity({ initial, userId }: { initial: ActivityEntry[]; userId: string }) {
  const [items, setItems] = useState(initial);
  const [fresh, setFresh] = useState<string | null>(null);
  const minute = useSyncExternalStore(subscribeMinute, nowMinute, noTime);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`activity:${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, (payload) => {
          const row = payload.new as NotificationRow;
          setItems((prev) =>
            prev.some((n) => n.id === row.id)
              ? prev
              : [{ id: row.id, message: row.message, href: notificationHref(row, "portal"), created_at: row.created_at }, ...prev].slice(0, MAX)
          );
          setFresh(row.id);
        })
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box aria-hidden className="live-dot" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>Latest</Typography>
        <Typography sx={{ ml: "auto", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "primary.main", fontWeight: 700 }}>Live</Typography>
      </Box>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>Nothing new yet. Updates from Alchemica will appear here as they happen.</Typography>
      ) : (
        <Box component="ul" aria-live="polite" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 0.25 }}>
          {items.map((item) => (
            <Box component="li" key={item.id} className={item.id === fresh ? "live-new" : undefined} sx={{ minWidth: 0 }}>
              <LinkBox
                href={item.href}
                sx={{ display: "flex", gap: 1, alignItems: "baseline", px: 1, py: 0.75, mx: -1, borderRadius: 1, color: "text.primary", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 13 }} title={item.message}>
                  {item.message}
                </Typography>
                <Typography sx={{ flexShrink: 0, fontSize: 11, color: "text.muted" }}>{minute === null ? "" : timeAgo(item.created_at)}</Typography>
              </LinkBox>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
