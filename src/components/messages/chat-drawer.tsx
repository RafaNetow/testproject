"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowBackIcon, AssistantIcon, ChatOutlined, Close, ForumOutlined } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { getThread, listThreads } from "@/lib/actions/messages";
import type { ThreadMessage, ThreadRead, ThreadSummary } from "@/lib/messages";
import { MessageThread } from "./message-thread";
import { AssistantPanel } from "./assistant-panel";

type Project = { id: string; name: string };

function when(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The chat lives in the top bar: an icon with the unread count that opens a
 * right-hand panel over whatever page you're on. Clients land straight in
 * their project's conversation with Axel; the admin gets the list of client
 * threads first. `?chat=<projectId>` (from notifications, "Waiting on you" or
 * the weekly email) opens it on that conversation.
 */
export function ChatDrawer({
  surface,
  viewerId,
  projects = [],
  unread,
  aiEnabled = false,
}: {
  surface: "portal" | "admin";
  viewerId: string;
  /** The client's projects (portal only). */
  projects?: Project[];
  unread: number;
  /** Portal: show the "Ask Alchemica" tab. Admin: offer "Suggest reply" drafts. */
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = surface === "admin";
  const linked = searchParams.get("chat");

  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [thread, setThread] = useState<{ messages: ThreadMessage[]; reads: ThreadRead[] } | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [tab, setTab] = useState<"axel" | "assistant">("axel");
  // A question the client chose to send to Axel instead of the assistant.
  const [prefill, setPrefill] = useState<string | null>(null);
  const showAssistant = !isAdmin && aiEnabled;

  // A ?chat= link opens the panel on that conversation. Done after mount (not
  // during render) so a fresh page load can't lose it to hydration.
  useEffect(() => {
    if (!linked) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setOpen(true);
      setProjectId(linked);
      setThread(null);
    });
    return () => {
      cancelled = true;
    };
  }, [linked]);

  function defaultProject() {
    if (isAdmin) return null;
    const current = searchParams.get("project");
    return projects.find((p) => p.id === current)?.id ?? projects[0]?.id ?? null;
  }

  function openPanel() {
    setOpen(true);
    if (!projectId) setProjectId(defaultProject());
  }

  function closePanel() {
    setOpen(false);
    if (linked) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("chat");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  const refreshThread = useCallback(async () => {
    if (!projectId) return;
    const data = await getThread(projectId);
    setThread(data);
  }, [projectId]);

  const refreshList = useCallback(async () => {
    if (!isAdmin) return;
    setThreads(await listThreads());
  }, [isAdmin]);

  // Load whatever the panel is showing when it opens or switches conversation.
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    getThread(projectId).then((data) => {
      if (!cancelled) setThread(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!open || !isAdmin) return;
    let cancelled = false;
    listThreads().then((list) => {
      if (!cancelled) setThreads(list);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isAdmin]);

  // The admin's list stays live while it's on screen.
  useEffect(() => {
    if (!open || !isAdmin || projectId) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel("messages:inbox")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshList())
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [open, isAdmin, projectId, refreshList]);

  // Keep the top-bar badge live: a message from someone else re-runs the layout's
  // unread count (RLS limits the feed to threads this user belongs to).
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`messages:badge:${viewerId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          if ((payload.new as { author_id?: string }).author_id !== viewerId) router.refresh();
        })
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [viewerId, router]);

  // Reading a thread changes the unread badge, which the layout computes.
  const onRead = useCallback(() => router.refresh(), [router]);

  const summary = threads?.find((t) => t.projectId === projectId);
  const title = isAdmin
    ? projectId
      ? summary
        ? `${summary.org} · ${summary.project}`
        : "Conversation"
      : "Messages"
    : "Axel";

  return (
    <>
      <Tooltip title="Messages">
        <IconButton aria-label={unread ? `Messages, ${unread} unread` : "Messages"} onClick={openPanel}>
          <Badge badgeContent={unread} color="error" max={99}>
            <ChatOutlined sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={closePanel}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 }, display: "flex", flexDirection: "column" } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
          {isAdmin && projectId && (
            <IconButton aria-label="Back to all conversations" onClick={() => { setProjectId(null); setThread(null); void refreshList(); }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <Box sx={{ minWidth: 0, flex: 1, pl: isAdmin && projectId ? 0 : 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }} noWrap>
              {title}
            </Typography>
            {!isAdmin && projects.length === 1 && (
              <Typography sx={{ fontSize: 12, color: "text.muted" }} noWrap>
                {projects[0].name}
              </Typography>
            )}
          </Box>
          {!isAdmin && projects.length > 1 && projectId && (
            <Select
              size="small"
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setThread(null); }}
              inputProps={{ "aria-label": "Project" }}
              sx={{ maxWidth: 200, fontSize: 13 }}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: 14 }}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          )}
          <IconButton aria-label="Close messages" onClick={closePanel}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {showAssistant && projectId && (
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            aria-label="Who to ask"
            sx={{ minHeight: 44, borderBottom: 1, borderColor: "divider", "& .MuiTabs-list": { gap: 0 } }}
          >
            <Tab value="axel" label="Axel" icon={<ChatOutlined sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ minHeight: 44, fontSize: 13 }} />
            <Tab value="assistant" label="Ask Alchemica" icon={<AssistantIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ minHeight: 44, fontSize: 13 }} />
          </Tabs>
        )}

        {projectId && showAssistant && tab === "assistant" ? (
          <AssistantPanel
            key={`assistant-${projectId}`}
            projectId={projectId}
            onAskAxel={(question) => {
              setPrefill(question);
              setTab("axel");
            }}
          />
        ) : projectId ? (
          thread ? (
            <MessageThread
              key={`${projectId}-${prefill ?? ""}`}
              projectId={projectId}
              viewerId={viewerId}
              isAdmin={isAdmin}
              messages={thread.messages}
              reads={thread.reads}
              onRefresh={refreshThread}
              onRead={onRead}
              initialText={prefill ?? undefined}
              canSuggest={isAdmin && aiEnabled}
            />
          ) : (
            <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
              <CircularProgress size={24} />
            </Box>
          )
        ) : isAdmin ? (
          <ThreadList threads={threads} onPick={(id) => { setProjectId(id); setThread(null); }} />
        ) : (
          <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography sx={{ fontSize: 14 }}>Once your engagement is set up, you can message Axel here.</Typography>
          </Box>
        )}
      </Drawer>
    </>
  );
}

function ThreadList({ threads, onPick }: { threads: ThreadSummary[] | null; onPick: (projectId: string) => void }) {
  if (!threads) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (!threads.length) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3, textAlign: "center", color: "text.secondary" }}>
        <Box>
          <ForumOutlined sx={{ fontSize: 36, color: "text.muted" }} />
          <Typography sx={{ mt: 1, fontSize: 14 }}>No conversations yet. When a client writes, it shows up here.</Typography>
        </Box>
      </Box>
    );
  }
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, overflowY: "auto", flex: 1 }}>
      {threads.map((t) => (
        <Box component="li" key={t.projectId} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <ButtonBase
            onClick={() => onPick(t.projectId)}
            sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: t.unread ? 700 : 600 }} noWrap>
                {t.org} · {t.project}
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 13, color: t.unread ? "text.primary" : "text.secondary" }} noWrap>
                {t.fromMe ? "You: " : ""}
                {t.body}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 12, color: "text.muted" }}>{when(t.at)}</Typography>
              {t.unread > 0 && (
                <Box
                  component="span"
                  aria-label={`${t.unread} unread`}
                  sx={{ minWidth: 20, height: 20, px: 0.75, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}
                >
                  {t.unread}
                </Box>
              )}
            </Box>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  );
}
