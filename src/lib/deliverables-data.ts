import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DeliverableRow } from "@/components/deliverables/deliverables-view";
import type { DeliverableStatus } from "@/lib/deliverables";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const BUCKET = "project-files";

type RawFile = {
  id: string;
  filename: string;
  size_bytes: number;
  storage_path: string;
};

/**
 * Loads a project's deliverables with their attached files and a signed
 * download URL per file. What comes back is already filtered by Row-Level
 * Security: a client never receives drafts.
 */
export async function loadDeliverables(
  supabase: Supabase,
  projectId: string
): Promise<DeliverableRow[]> {
  const { data } = await supabase
    .from("deliverables")
    .select(
      "id, title, description, status, due_date, reviewed_at, review_note, created_at, deliverable_files(files(id, filename, size_bytes, storage_path))"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];

  const paths = rows.flatMap((d) =>
    ((d.deliverable_files ?? []) as unknown as { files: RawFile | null }[])
      .map((df) => df.files?.storage_path)
      .filter((p): p is string => Boolean(p))
  );
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls([...new Set(paths)], 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    status: d.status as DeliverableStatus,
    due_date: d.due_date,
    reviewed_at: d.reviewed_at,
    review_note: d.review_note,
    files: ((d.deliverable_files ?? []) as unknown as { files: RawFile | null }[])
      .map((df) => df.files)
      .filter((f): f is RawFile => Boolean(f))
      .map((f) => ({
        id: f.id,
        filename: f.filename,
        size_bytes: f.size_bytes,
        url: urlByPath.get(f.storage_path) ?? null,
      })),
  }));
}
