import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationKind } from "@/lib/notification-links";

/**
 * Announces an action to everyone involved in the engagement — the client's
 * members and the Alchemica team — except whoever performed it. The actor's
 * name is prefixed by the database, so `message` reads as a predicate:
 * `uploaded "spec.pdf"`, `moved "Draft plan" to Done`.
 *
 * Best-effort: a notification failing must never fail the action itself.
 */
export async function recordActivity(activity: {
  kind: NotificationKind;
  message: string;
  projectId?: string | null;
  orgId?: string | null;
  /** Only for cards that still exist — pass `projectId` after a delete. */
  cardId?: string | null;
  /** Internal events (drafts, prospects…) the client must not hear about. */
  adminsOnly?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("notify_activity", {
      p_kind: activity.kind,
      p_message: activity.message,
      p_project: activity.projectId ?? null,
      p_org: activity.orgId ?? null,
      p_card: activity.cardId ?? null,
      p_admins_only: activity.adminsOnly ?? false,
    });
    if (error) console.error("recordActivity: failed", error.message);
  } catch (err) {
    console.error("recordActivity: failed", err);
  }
}

/**
 * Reads the project and display name of a row, for describing an action on it
 * — call it before a delete, while the row still exists.
 */
export async function entityInfo(table: string, id: string, nameColumn: string, withProject = true) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from(table)
      .select(withProject ? `project_id, ${nameColumn}` : nameColumn)
      .eq("id", id)
      .maybeSingle();
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      projectId: (row.project_id as string | null | undefined) ?? null,
      name: (row[nameColumn] as string | null | undefined) ?? null,
    };
  } catch {
    return { projectId: null, name: null };
  }
}

/** Quotes a user-supplied name for a notification, trimmed to a readable length. */
export function quoted(name: string | null | undefined) {
  const text = (name ?? "").trim() || "untitled";
  return `"${text.length > 60 ? `${text.slice(0, 57)}…` : text}"`;
}
