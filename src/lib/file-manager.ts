import { STATUS_TONE, category, type Tone } from "@/lib/palette";

/**
 * The File Manager's pure parts: what kind each file is, the toolbar filters
 * (search, type, dates, favourites) and folder totals. Kept apart from the
 * components so they can be tested.
 */

/** The type groups the Type filter offers, in Minimal's order. */
export const FILE_GROUPS = [
  { key: "pdf", name: "PDF" },
  { key: "doc", name: "Word & text" },
  { key: "sheet", name: "Excel & CSV" },
  { key: "slides", name: "PowerPoint" },
  { key: "image", name: "Images" },
  { key: "archive", name: "Zip" },
  { key: "other", name: "Other" },
] as const;
export type FileGroup = (typeof FILE_GROUPS)[number]["key"];

/** A short label, a group and a hue per file, like a file manager's type icons. */
export function fileType(filename: string, mime: string | null): { label: string; group: FileGroup; tone: Tone } {
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  if (ext === "pdf" || mime === "application/pdf") return { label: "PDF", group: "pdf", tone: STATUS_TONE.error };
  if (mime?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return { label: "IMG", group: "image", tone: category(4) };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: ext === "csv" ? "CSV" : "XLS", group: "sheet", tone: STATUS_TONE.success };
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext))
    return { label: ext === "txt" || ext === "md" ? "TXT" : "DOC", group: "doc", tone: STATUS_TONE.info };
  if (["ppt", "pptx"].includes(ext)) return { label: "PPT", group: "slides", tone: STATUS_TONE.warning };
  if (["zip", "rar", "7z", "gz"].includes(ext)) return { label: "ZIP", group: "archive", tone: category(3) };
  return { label: (ext.slice(0, 4) || "FILE").toUpperCase(), group: "other", tone: STATUS_TONE.neutral };
}

/** A link to the Files page at a folder (null = top level), keeping the page's other query (e.g. ?project=). */
export function folderHref(basePath: string, extraQuery: string | undefined, folderId: string | null, fileId?: string) {
  const params = new URLSearchParams(extraQuery);
  if (folderId) params.set("folder", folderId);
  else params.delete("folder");
  if (fileId) params.set("file", fileId);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export type FileFilters = {
  search: string;
  groups: FileGroup[];
  /** "YYYY-MM-DD", inclusive; null for open-ended. */
  from: string | null;
  to: string | null;
  favouritesOnly: boolean;
  technique: string | null;
};

export const NO_FILTERS: FileFilters = { search: "", groups: [], from: null, to: null, favouritesOnly: false, technique: null };

export function hasFilters(f: FileFilters) {
  return Boolean(f.search.trim() || f.groups.length || f.from || f.to || f.favouritesOnly || f.technique);
}

type Filterable = { filename: string; mime_type: string | null; created_at: string; favourite: boolean; technique: string | null };

/** The files that pass every active filter. Dates compare by the day the file was added (UTC day). */
export function filterFiles<T extends Filterable>(files: T[], f: FileFilters): T[] {
  const q = f.search.trim().toLowerCase();
  return files.filter((file) => {
    if (q && !file.filename.toLowerCase().includes(q)) return false;
    if (f.groups.length && !f.groups.includes(fileType(file.filename, file.mime_type).group)) return false;
    const day = file.created_at.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.favouritesOnly && !file.favourite) return false;
    if (f.technique && file.technique !== f.technique) return false;
    return true;
  });
}

/**
 * Folders that pass the search and favourites filters. Type, date and
 * technique describe files, so while any of them is on, folders step aside
 * (as on Minimal) and only matching files show.
 */
export function filterFolders<T extends { name: string; favourite: boolean }>(folders: T[], f: FileFilters): T[] {
  if (f.groups.length || f.from || f.to || f.technique) return [];
  const q = f.search.trim().toLowerCase();
  return folders.filter((d) => (!q || d.name.toLowerCase().includes(q)) && (!f.favouritesOnly || d.favourite));
}

/**
 * File count and total size per folder, including everything in nested
 * subfolders, so a folder card shows how much is really inside.
 */
export function folderTotals(
  folders: { id: string; parent_folder_id: string | null }[],
  files: { folder_id: string | null; size_bytes: number }[]
): Map<string, { count: number; size: number }> {
  const direct = new Map<string, { count: number; size: number }>();
  for (const f of files) {
    if (!f.folder_id) continue;
    const t = direct.get(f.folder_id) ?? { count: 0, size: 0 };
    direct.set(f.folder_id, { count: t.count + 1, size: t.size + f.size_bytes });
  }
  const children = new Map<string, string[]>();
  for (const d of folders) {
    if (d.parent_folder_id) children.set(d.parent_folder_id, [...(children.get(d.parent_folder_id) ?? []), d.id]);
  }
  const totals = new Map<string, { count: number; size: number }>();
  const visit = (id: string, seen: Set<string>): { count: number; size: number } => {
    const done = totals.get(id);
    if (done) return done;
    // Guard against a cycle in bad data.
    if (seen.has(id)) return { count: 0, size: 0 };
    seen.add(id);
    const sum = { ...(direct.get(id) ?? { count: 0, size: 0 }) };
    for (const child of children.get(id) ?? []) {
      const c = visit(child, seen);
      sum.count += c.count;
      sum.size += c.size;
    }
    totals.set(id, sum);
    return sum;
  };
  for (const d of folders) visit(d.id, new Set());
  return totals;
}
