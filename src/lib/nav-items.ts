import type { Icon } from "@phosphor-icons/react";
import {
  ChartLineUp,
  Cube,
  SquaresFour,
  FolderOpen,
  VideoCamera,
  ChatCircleDots,
  NotePencil,
  UsersThree,
  Receipt,
  FileText,
  Buildings,
  CalendarBlank,
  Target,
  Clock,
} from "@phosphor-icons/react/dist/ssr";

export type NavItem = { label: string; href: string; icon: Icon };

export const PORTAL_NAV: NavItem[] = [
  { label: "Executive Summary", href: "/portal", icon: ChartLineUp },
  { label: "Board", href: "/portal/board", icon: SquaresFour },
  { label: "Deliverables", href: "/portal/deliverables", icon: Cube },
  { label: "Files", href: "/portal/files", icon: FolderOpen },
  { label: "Meetings", href: "/portal/meetings", icon: VideoCamera },
  { label: "Decisions", href: "/portal/decisions", icon: ChatCircleDots },
  { label: "Updates", href: "/portal/updates", icon: NotePencil },
  { label: "Hours", href: "/portal/hours", icon: Clock },
  { label: "Team", href: "/portal/team", icon: UsersThree },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Contracts", href: "/portal/contracts", icon: FileText },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: SquaresFour },
  { label: "Clients", href: "/admin/clients", icon: Buildings },
  { label: "Reports", href: "/admin/reports", icon: ChartLineUp },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarBlank },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Contracts", href: "/admin/contracts", icon: FileText },
  { label: "Prospects", href: "/admin/prospects", icon: Target },
];
