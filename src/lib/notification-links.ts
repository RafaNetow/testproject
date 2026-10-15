export type NotificationKind =
  | "card"
  | "deliverable"
  | "file"
  | "meeting"
  | "decision"
  | "update"
  | "hours"
  | "invoice"
  | "contract"
  | "team"
  | "project"
  | "client"
  | "prospect"
  | "message";

export type NotificationRow = {
  id: string;
  message: string;
  kind: string;
  project_id: string | null;
  org_id: string | null;
  read_at: string | null;
  created_at: string;
};

/** Project sections that exist on both surfaces, keyed by notification kind. */
const SECTION: Partial<Record<NotificationKind, string>> = {
  card: "board",
  deliverable: "deliverables",
  file: "files",
  meeting: "meetings",
  decision: "decisions",
  update: "updates",
  hours: "hours",
  invoice: "invoices",
  contract: "contracts",
  message: "messages",
};

/** Where clicking a notification takes the reader, per surface. */
export function notificationHref(n: Pick<NotificationRow, "kind" | "project_id" | "org_id">, surface: "portal" | "admin") {
  const kind = n.kind as NotificationKind;
  const section = SECTION[kind];

  if (surface === "admin") {
    if (kind === "prospect") return "/admin/prospects";
    if (n.org_id && n.project_id && section) return `/admin/clients/${n.org_id}/projects/${n.project_id}/${section}`;
    if (n.org_id) return `/admin/clients/${n.org_id}`;
    return "/admin";
  }

  if (kind === "team") return "/portal/team";
  if (section) return n.project_id ? `/portal/${section}?project=${n.project_id}` : `/portal/${section}`;
  return "/portal";
}
