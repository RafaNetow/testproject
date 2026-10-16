import type { SupabaseClient } from "@supabase/supabase-js";
import { countUnread } from "@/lib/messages";

export type WaitingKind = "review" | "answer" | "sign" | "upload" | "reply";

export type WaitingItem = {
  kind: WaitingKind;
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  /** Portal path (or an external URL when `external`). */
  href: string;
  external?: boolean;
  due: string | null;
};

/** The order a reader should tackle things in when nothing is dated. */
const KIND_ORDER: Record<WaitingKind, number> = { reply: 0, review: 1, sign: 2, upload: 3, answer: 4 };

/** Dated items first (soonest first), then by kind, then alphabetically. */
export function sortWaiting(items: WaitingItem[]): WaitingItem[] {
  return [...items].sort((a, b) => {
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    return a.title.localeCompare(b.title);
  });
}

type Project = { id: string; name: string };

/**
 * Everything waiting on the client across their projects: deliverables to
 * review, questions on the board, contracts to sign, data to upload, and
 * unread messages (when `userId` is given — the reader's own read marker).
 * Works with either the RLS-scoped client (portal) or the service-role client
 * (weekly digest) — the caller decides whose projects are passed in.
 */
export async function loadWaiting(
  supabase: SupabaseClient,
  { orgId, projects, userId }: { orgId: string; projects: Project[]; userId?: string }
): Promise<WaitingItem[]> {
  const projectIds = projects.map((p) => p.id);
  if (!projectIds.length) return [];
  const nameOf = new Map(projects.map((p) => [p.id, p.name]));
  const projectQuery = (id: string | null) => (id && projects.length > 1 ? `?project=${id}` : "");

  const { data: waitingColumns } = await supabase
    .from("board_columns")
    .select("id")
    .in("project_id", projectIds)
    .ilike("name", "waiting on you");
  const columnIds = (waitingColumns ?? []).map((c) => c.id);

  const noRows = Promise.resolve({ data: [] as never[] });
  const [{ data: deliverables }, { data: cards }, { data: contracts }, { data: requests }, { data: msgs }, { data: reads }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, title, due_date, project_id")
      .in("project_id", projectIds)
      .eq("status", "in_review"),
    columnIds.length
      ? supabase.from("board_cards").select("id, title, due_date, project_id").in("column_id", columnIds)
      : Promise.resolve({ data: [] as { id: string; title: string; due_date: string | null; project_id: string }[] }),
    supabase
      .from("contracts")
      .select("id, title, project_id, documenso_signing_url")
      .eq("org_id", orgId)
      .in("signing_status", ["sent", "partially_signed"])
      .not("documenso_signing_url", "is", null),
    supabase
      .from("data_requests")
      .select("id, title, due_date, project_id")
      .in("project_id", projectIds)
      .eq("status", "requested"),
    userId
      ? supabase.from("messages").select("project_id, created_at, author_id").in("project_id", projectIds).neq("author_id", userId)
      : noRows,
    userId ? supabase.from("message_reads").select("project_id, last_read_at").eq("user_id", userId).in("project_id", projectIds) : noRows,
  ]);
  const unread = userId ? countUnread(msgs ?? [], reads ?? [], userId) : {};

  const items: WaitingItem[] = [
    ...(deliverables ?? []).map((d) => ({
      kind: "review" as const,
      id: d.id,
      title: d.title,
      projectId: d.project_id,
      projectName: nameOf.get(d.project_id) ?? null,
      href: `/portal/deliverables${projectQuery(d.project_id)}`,
      due: d.due_date,
    })),
    ...(cards ?? []).map((c) => ({
      kind: "answer" as const,
      id: c.id,
      title: c.title,
      projectId: c.project_id,
      projectName: nameOf.get(c.project_id) ?? null,
      href: `/portal/board?${projects.length > 1 ? `project=${c.project_id}&` : ""}card=${c.id}`,
      due: c.due_date,
    })),
    ...(contracts ?? []).map((c) => ({
      kind: "sign" as const,
      id: c.id,
      title: c.title,
      projectId: c.project_id,
      projectName: c.project_id ? (nameOf.get(c.project_id) ?? null) : null,
      href: c.documenso_signing_url as string,
      external: true,
      due: null,
    })),
    ...(requests ?? []).map((r) => ({
      kind: "upload" as const,
      id: r.id,
      title: r.title,
      projectId: r.project_id,
      projectName: nameOf.get(r.project_id) ?? null,
      href: `/portal/files${projectQuery(r.project_id)}`,
      due: r.due_date,
    })),
    ...Object.entries(unread).map(([projectId, n]) => ({
      kind: "reply" as const,
      id: projectId,
      title: `${n} new ${n === 1 ? "message" : "messages"}`,
      projectId,
      projectName: nameOf.get(projectId) ?? null,
      href: `/portal?chat=${projectId}`,
      due: null,
    })),
  ];

  return sortWaiting(items);
}
