export const DELIVERABLE_STATUSES = [
  "draft",
  "in_progress",
  "in_review",
  "changes_requested",
  "approved",
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export function isDeliverableStatus(value: string): value is DeliverableStatus {
  return (DELIVERABLE_STATUSES as readonly string[]).includes(value);
}

/** Labels as Alchemica (the admin) sees them. */
export const ADMIN_STATUS_LABEL: Record<DeliverableStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  in_review: "Awaiting client",
  changes_requested: "Changes requested",
  approved: "Approved",
};

/** Labels as the client sees them — "in review" is *their* turn. */
export const CLIENT_STATUS_LABEL: Record<DeliverableStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  in_review: "Awaiting your review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

/** Calendar day in Copenhagen as YYYY-MM-DD — "today" for due-date purposes. */
export function todayInCopenhagen(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" }).format(now);
}

/**
 * Renders a date-only value (YYYY-MM-DD) without letting the server's or
 * browser's timezone shift it by a day.
 */
export function formatDateOnly(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A deliverable is overdue when its due date has passed and it isn't done or waiting on the client. */
export function isOverdue(
  dueDate: string | null,
  status: DeliverableStatus,
  today: string = todayInCopenhagen()
): boolean {
  if (!dueDate) return false;
  if (status === "approved" || status === "in_review" || status === "draft") return false;
  return dueDate.slice(0, 10) < today;
}

type Groupable = { status: DeliverableStatus };

/**
 * The client's page order: what needs their attention first, then what is
 * being worked on, then what's finished.
 */
export function groupForClient<T extends Groupable>(items: T[]) {
  return {
    awaitingReview: items.filter((d) => d.status === "in_review"),
    changesRequested: items.filter((d) => d.status === "changes_requested"),
    inProgress: items.filter((d) => d.status === "in_progress"),
    approved: items.filter((d) => d.status === "approved"),
  };
}
