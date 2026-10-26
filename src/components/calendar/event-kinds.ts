import type { CalendarEvent, CalendarEventKind } from "@/lib/calendar";
import {
  CalendarMonthOutlined,
  DatasetOutlined,
  EventNoteOutlined,
  ReceiptLongOutlined,
  ScienceOutlined,
  SummarizeOutlined,
  TimelineOutlined,
  type IconComponent,
} from "@/components/icons";

export const KIND_META: Record<CalendarEventKind, { label: string; plural: string; Icon: IconComponent }> = {
  event: { label: "Your event", plural: "Your events", Icon: CalendarMonthOutlined },
  meeting: { label: "Meeting", plural: "Meetings", Icon: EventNoteOutlined },
  deliverable: { label: "Deliverable due", plural: "Deliverables", Icon: SummarizeOutlined },
  request: { label: "Data request due", plural: "Data requests", Icon: DatasetOutlined },
  stage: { label: "Project stage", plural: "Stages", Icon: TimelineOutlined },
  invoice: { label: "Invoice due", plural: "Invoices", Icon: ReceiptLongOutlined },
  card: { label: "Board card due", plural: "Board cards", Icon: ScienceOutlined },
  google: { label: "Google Calendar", plural: "Google", Icon: CalendarMonthOutlined },
};

export const KIND_ORDER: CalendarEventKind[] = ["event", "meeting", "deliverable", "request", "stage", "card", "invoice", "google"];

const FINISHED = new Set(["approved", "received", "paid", "past", "done", "signed", "completed", "cancelled"]);

/** A due item whose day has passed and that nobody has finished. */
export function isOverdue(e: CalendarEvent, today: string): boolean {
  if (!e.allDay || e.kind === "event" || e.kind === "stage" || e.kind === "card" || e.kind === "google") return false;
  return e.end < today && !FINISHED.has(e.status);
}

/**
 * The colour an event is drawn in. Minimal palette: meetings carry the accent,
 * overdue items are flagged, everything else stays grey.
 */
export function eventColor(e: CalendarEvent, today: string): string {
  if (e.status === "cancelled") return "var(--color-muted-foreground)";
  if (isOverdue(e, today)) return "var(--color-error)";
  if (e.kind === "meeting") return "var(--color-accent)";
  return "var(--color-muted-foreground)";
}
