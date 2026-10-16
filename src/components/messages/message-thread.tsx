"use client";

import { Fragment, useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AttachFile, Close, ForumOutlined, MenuBookOutlined, MoreVert, Send, ViewKanbanOutlined } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { markThreadRead, messageToCard, messageToDecision, sendMessage, type SendResult } from "@/lib/actions/messages";
import { initials } from "@/components/board/board-colors";
import type { ThreadMessage, ThreadRead } from "@/lib/messages";

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * A project's conversation between the client and Alchemica, sized to fill
 * the chat panel. New messages and read markers arrive over Realtime and ask
 * the parent to refetch, so names, attachments and links come from the server.
 */
export function MessageThread({
  projectId,
  viewerId,
  isAdmin,
  messages,
  reads,
  onRefresh,
  onRead,
}: {
  projectId: string;
  viewerId: string;
  isAdmin: boolean;
  messages: ThreadMessage[];
  reads: ThreadRead[];
  /** Refetch the thread (after a send, an admin action or a realtime event). */
  onRefresh: () => void;
  /** Called after the thread is marked read, so unread badges can update. */
  onRead?: () => void;
}) {
  const paths: string[] = [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SendResult | null, FormData>(
    sendMessage.bind(null, projectId, paths),
    null
  );
  const [attachment, setAttachment] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) {
      setFormKey((k) => k + 1);
      setAttachment("");
    }
  }
  useEffect(() => {
    if (state?.ok) onRefresh();
  }, [state, onRefresh]);

  // Live updates: any new message or read marker in this thread refetches it.
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
        .channel(`messages:${projectId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` }, () =>
          onRefresh()
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "message_reads", filter: `project_id=eq.${projectId}` }, () =>
          onRefresh()
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [projectId, onRefresh]);

  // Mark as read when someone else's message is newer than this viewer's last visit.
  const myRead = reads.find((r) => r.user_id === viewerId)?.last_read_at ?? "";
  const latestFromOthers = [...messages].reverse().find((m) => m.author_id !== viewerId)?.created_at ?? "";
  useEffect(() => {
    if (latestFromOthers && latestFromOthers > myRead && document.visibilityState === "visible") {
      void markThreadRead(projectId).then(() => onRead?.());
    }
  }, [latestFromOthers, myRead, projectId, onRead]);

  // Keep the newest message in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const lastMine = [...messages].reverse().find((m) => m.author_id === viewerId);
  const seenBy = lastMine
    ? reads.filter((r) => r.user_id !== viewerId && r.last_read_at >= lastMine.created_at).map((r) => r.name)
    : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Box ref={scrollRef} role="log" aria-live="polite" aria-label="Messages" sx={{ flex: 1, overflowY: "auto", px: 2, py: 2.5 }}>
        {messages.length === 0 ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", color: "text.secondary" }}>
            <Box>
              <ForumOutlined sx={{ fontSize: 40, color: "text.muted" }} />
              <Typography sx={{ mt: 1, fontWeight: 600, color: "text.primary" }}>No messages yet</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 14 }}>
                {isAdmin ? "Start the conversation with the client." : "Ask Axel anything about this project."}
              </Typography>
            </Box>
          </Box>
        ) : (
          messages.map((m, i) => {
            const mine = m.author_id === viewerId;
            const newDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at);
            const grouped = !newDay && i > 0 && messages[i - 1].author_id === m.author_id;
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <Typography sx={{ my: 2, textAlign: "center", fontSize: 12, fontWeight: 600, color: "text.muted" }}>{dayLabel(m.created_at)}</Typography>
                )}
                <MessageRow message={m} mine={mine} grouped={grouped} isAdmin={isAdmin} paths={paths} onDone={onRefresh} />
              </Fragment>
            );
          })
        )}
        {seenBy.length > 0 && (
          <Typography sx={{ mt: 0.5, textAlign: "right", fontSize: 12, color: "text.muted" }}>Seen by {seenBy.join(", ")}</Typography>
        )}
      </Box>

      <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, pt: 1.5, pb: 2 }}>
        <Typography sx={{ mb: 1, fontSize: 12, color: "text.muted" }}>
          {isAdmin ? "Messages are visible to everyone on the client's team." : "Axel usually replies within one business day."}
        </Typography>
        {state && !state.ok && state.message && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {state.message}
          </Alert>
        )}
        <Box key={formKey} component="form" ref={formRef} action={formAction} sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <Tooltip title="Attach a file">
            <IconButton component="label" aria-label="Attach a file" sx={{ mb: 0.25 }}>
              <AttachFile />
              <Box
                component="input"
                type="file"
                name="file"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAttachment(e.target.files?.[0]?.name ?? "")}
                sx={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", clip: "rect(0 0 0 0)" }}
              />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {attachment && (
              <Typography sx={{ mb: 0.5, fontSize: 12, color: "text.secondary" }} noWrap>
                Attached: {attachment}
              </Typography>
            )}
            <TextField
              name="body"
              placeholder="Write a message…"
              multiline
              maxRows={6}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { "aria-label": "Message", maxLength: 4000 } }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
          </Box>
          <Button type="submit" variant="contained" disabled={pending} endIcon={<Send sx={{ fontSize: 16 }} />} sx={{ mb: 0.25, minHeight: 40 }}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function MessageRow({
  message: m,
  mine,
  grouped,
  isAdmin,
  paths,
  onDone,
}: {
  message: ThreadMessage;
  mine: boolean;
  grouped: boolean;
  isAdmin: boolean;
  paths: string[];
  onDone: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, startTransition] = useTransition();

  function run(action: (id: string, p: string[]) => Promise<void>) {
    setAnchor(null);
    startTransition(async () => {
      await action(m.id, paths);
      onDone();
    });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end", gap: 1, mt: grouped ? 0.5 : 1.5 }}>
      <Avatar
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          fontSize: 11,
          fontWeight: 700,
          visibility: grouped ? "hidden" : "visible",
          bgcolor: m.author_is_admin ? "primary.main" : "var(--fill-neutral)",
          color: m.author_is_admin ? "primary.contrastText" : "text.secondary",
        }}
      >
        {initials(m.author_name)}
      </Avatar>
      <Box sx={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
        {!grouped && (
          <Typography sx={{ mb: 0.25, px: 0.5, fontSize: 12, color: "text.muted" }}>
            {mine ? "You" : m.author_name}
            {m.author_is_admin && !mine ? " · Alchemica" : ""} · {timeLabel(m.created_at)}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexDirection: mine ? "row-reverse" : "row" }}>
          <Box
            sx={{
              px: 1.75,
              py: 1,
              borderRadius: 2,
              borderBottomRightRadius: mine ? 4 : undefined,
              borderBottomLeftRadius: mine ? undefined : 4,
              bgcolor: mine ? "primary.main" : "var(--fill-neutral)",
              color: mine ? "primary.contrastText" : "text.primary",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Typography sx={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.body}</Typography>
            {m.file && (
              <Link
                href={m.file.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                sx={{ mt: 0.75, display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 13, fontWeight: 600, color: "inherit" }}
              >
                <AttachFile sx={{ fontSize: 15 }} />
                {m.file.filename}
              </Link>
            )}
          </Box>
          {isAdmin && (
            <>
              <IconButton size="small" aria-label="Message actions" onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: "text.muted" }}>
                <MoreVert sx={{ fontSize: 18 }} />
              </IconButton>
              <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => run(messageToDecision)} sx={{ fontSize: 14 }}>
                  <ListItemIcon>
                    <MenuBookOutlined sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  Log as decision
                </MenuItem>
                <MenuItem onClick={() => run(messageToCard)} sx={{ fontSize: 14 }}>
                  <ListItemIcon>
                    <ViewKanbanOutlined sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  Add to board
                </MenuItem>
                <MenuItem onClick={() => setAnchor(null)} sx={{ fontSize: 14, color: "text.secondary" }}>
                  <ListItemIcon>
                    <Close sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  Cancel
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
