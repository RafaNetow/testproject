import type { SupabaseClient } from "@supabase/supabase-js";

export type ThreadMessage = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_is_admin: boolean;
  file: { id: string; filename: string; url: string | null } | null;
};

export type ThreadRead = { user_id: string; name: string; is_admin: boolean; last_read_at: string };

type Participant = { id: string; name: string; is_admin: boolean };

/** A project's thread, oldest first, with author names, attachments and read markers. */
export async function loadThread(supabase: SupabaseClient, projectId: string) {
  const [{ data: rows }, { data: reads }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, body, created_at, author_id, file_id, files(id, filename, storage_path)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase.from("message_reads").select("user_id, last_read_at").eq("project_id", projectId),
  ]);

  // Clients can't read other profiles; this returns just names for the thread's people.
  const { data: people } = await supabase.rpc("thread_participants", { p_project: projectId });
  const byId = new Map(((people ?? []) as Participant[]).map((p) => [p.id, p]));

  const paths = (rows ?? [])
    .map((m) => (m.files as unknown as { storage_path: string } | null)?.storage_path)
    .filter(Boolean) as string[];
  const { data: signed } = paths.length
    ? await supabase.storage.from("project-files").createSignedUrls(paths, 60 * 60)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const messages: ThreadMessage[] = (rows ?? []).map((m) => {
    const f = m.files as unknown as { id: string; filename: string; storage_path: string } | null;
    const author = byId.get(m.author_id);
    return {
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      author_id: m.author_id,
      author_name: author?.name ?? "Someone",
      author_is_admin: author?.is_admin ?? false,
      file: f ? { id: f.id, filename: f.filename, url: urlByPath.get(f.storage_path) ?? null } : null,
    };
  });

  const threadReads: ThreadRead[] = (reads ?? []).map((r) => {
    const p = byId.get(r.user_id);
    return { user_id: r.user_id, name: p?.name ?? "Someone", is_admin: p?.is_admin ?? false, last_read_at: r.last_read_at };
  });

  return { messages, reads: threadReads };
}

/** Messages from other people newer than the reader's last visit, per project. */
export function countUnread(
  messages: { project_id: string; created_at: string; author_id: string }[],
  reads: { project_id: string; last_read_at: string }[],
  userId: string
) {
  const lastRead = new Map(reads.map((r) => [r.project_id, r.last_read_at]));
  const counts: Record<string, number> = {};
  for (const m of messages) {
    if (m.author_id === userId) continue;
    const seen = lastRead.get(m.project_id);
    if (!seen || m.created_at > seen) counts[m.project_id] = (counts[m.project_id] ?? 0) + 1;
  }
  return counts;
}

/** Unread counts per project for one user (nav badges, admin inbox). */
export async function loadUnread(supabase: SupabaseClient, userId: string, projectIds?: string[]) {
  let msgQuery = supabase.from("messages").select("project_id, created_at, author_id").neq("author_id", userId);
  let readQuery = supabase.from("message_reads").select("project_id, last_read_at").eq("user_id", userId);
  if (projectIds) {
    if (!projectIds.length) return {} as Record<string, number>;
    msgQuery = msgQuery.in("project_id", projectIds);
    readQuery = readQuery.in("project_id", projectIds);
  }
  const [{ data: msgs }, { data: reads }] = await Promise.all([msgQuery, readQuery]);
  return countUnread(msgs ?? [], reads ?? [], userId);
}
