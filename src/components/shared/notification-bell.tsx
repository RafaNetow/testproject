"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react/dist/ssr";
import { Popover } from "@/components/shared/popover";
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
    <Popover
      align="right"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={() => {
            toggle();
            markAllRead();
          }}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            dark
              ? "text-white/70 hover:bg-white/10 hover:text-white"
              : "text-secondary hover:bg-muted hover:text-primary"
          }`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={close}
                className={`block border-b border-border px-4 py-3 text-sm last:border-0 transition-colors hover:bg-muted ${
                  !readIds.has(n.id) ? "bg-accent/5" : ""
                }`}
              >
                <p className="text-primary">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </Popover>
  );
}
