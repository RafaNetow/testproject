import { Business, BusinessOutlined, CalendarMonth, CalendarMonthOutlined, Dashboard, DashboardOutlined, Dataset, DatasetOutlined, Description, DescriptionOutlined, EventNote, EventNoteOutlined, Groups, GroupsOutlined, Hub, HubOutlined, MenuBook, MenuBookOutlined, ReceiptLong, ReceiptLongOutlined, ScatterPlot, ScatterPlotOutlined, Science, ScienceOutlined, Summarize, SummarizeOutlined, Timeline, TimelineOutlined, Timer, TimerOutlined, TrackChanges, TrackChangesOutlined, type IconComponent } from "@/components/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconComponent;
  /** Filled variant shown when the item is the current page. */
  activeIcon: IconComponent;
};

export const PORTAL_NAV: NavItem[] = [
  { label: "Executive Summary", href: "/portal", icon: HubOutlined, activeIcon: Hub },
  { label: "Board", href: "/portal/board", icon: ScienceOutlined, activeIcon: Science },
  { label: "Deliverables", href: "/portal/deliverables", icon: SummarizeOutlined, activeIcon: Summarize },
  { label: "Files", href: "/portal/files", icon: DatasetOutlined, activeIcon: Dataset },
  { label: "Meetings", href: "/portal/meetings", icon: EventNoteOutlined, activeIcon: EventNote },
  { label: "Decisions", href: "/portal/decisions", icon: MenuBookOutlined, activeIcon: MenuBook },
  { label: "Updates", href: "/portal/updates", icon: TimelineOutlined, activeIcon: Timeline },
  { label: "Hours", href: "/portal/hours", icon: TimerOutlined, activeIcon: Timer },
  { label: "Team", href: "/portal/team", icon: GroupsOutlined, activeIcon: Groups },
  { label: "Invoices", href: "/portal/invoices", icon: ReceiptLongOutlined, activeIcon: ReceiptLong },
  { label: "Contracts", href: "/portal/contracts", icon: DescriptionOutlined, activeIcon: Description },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: DashboardOutlined, activeIcon: Dashboard },
  { label: "Clients", href: "/admin/clients", icon: BusinessOutlined, activeIcon: Business },
  { label: "Reports", href: "/admin/reports", icon: ScatterPlotOutlined, activeIcon: ScatterPlot },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarMonthOutlined, activeIcon: CalendarMonth },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptLongOutlined, activeIcon: ReceiptLong },
  { label: "Contracts", href: "/admin/contracts", icon: DescriptionOutlined, activeIcon: Description },
  { label: "Prospects", href: "/admin/prospects", icon: TrackChangesOutlined, activeIcon: TrackChanges },
];
