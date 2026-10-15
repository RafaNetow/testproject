import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { requireAxelAdmin, requireSessionUser } from "@/lib/dal";
import { loadUnread } from "@/lib/messages";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkBox } from "@/components/shared/link-box";

function when(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Every client conversation in one place, unread threads first. */
export default async function MessagesInboxPage() {
  await requireAxelAdmin();
  const [user, supabase] = await Promise.all([requireSessionUser(), createClient()]);

  const [{ data: recent }, unread] = await Promise.all([
    supabase
      .from("messages")
      .select("project_id, body, created_at, author_id, projects(name, org_id, organizations(name))")
      .order("created_at", { ascending: false })
      .limit(1000),
    loadUnread(supabase, user.id),
  ]);

  type Row = { projectId: string; orgId: string; project: string; org: string; body: string; at: string; fromMe: boolean };
  const threads = new Map<string, Row>();
  for (const m of recent ?? []) {
    if (threads.has(m.project_id)) continue;
    const p = m.projects as unknown as { name: string; org_id: string; organizations: { name: string } | null } | null;
    if (!p) continue;
    threads.set(m.project_id, {
      projectId: m.project_id,
      orgId: p.org_id,
      project: p.name,
      org: p.organizations?.name ?? "",
      body: m.body,
      at: m.created_at,
      fromMe: m.author_id === user.id,
    });
  }
  const rows = [...threads.values()].sort((a, b) => (unread[b.projectId] ?? 0) - (unread[a.projectId] ?? 0) || b.at.localeCompare(a.at));

  return (
    <Stack spacing={3}>
      <SectionHeader eyebrow="Messages" title="Inbox" subtitle="Conversations with every client, newest and unread first." />
      {rows.length === 0 ? (
        <EmptyState title="No conversations yet">When a client writes from their portal, the thread shows up here.</EmptyState>
      ) : (
        <Paper variant="outlined" component="ul" sx={{ listStyle: "none", m: 0, p: 0, overflow: "hidden" }}>
          {rows.map((r, i) => {
            const count = unread[r.projectId] ?? 0;
            return (
              <Box component="li" key={r.projectId} sx={{ borderTop: i ? 1 : 0, borderColor: "divider" }}>
                <LinkBox
                  href={`/admin/clients/${r.orgId}/projects/${r.projectId}/messages`}
                  sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 2, color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: count ? 700 : 600 }} noWrap>
                      {r.org} · {r.project}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 13, color: count ? "text.primary" : "text.secondary" }} noWrap>
                      {r.fromMe ? "You: " : ""}
                      {r.body}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 12, color: "text.muted" }}>{when(r.at)}</Typography>
                    {count > 0 && (
                      <Box
                        component="span"
                        aria-label={`${count} unread`}
                        sx={{ minWidth: 20, height: 20, px: 0.75, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                </LinkBox>
              </Box>
            );
          })}
        </Paper>
      )}
    </Stack>
  );
}
