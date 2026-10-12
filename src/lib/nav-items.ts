import type { SvgIconComponent } from "@mui/icons-material";
import Business from "@mui/icons-material/Business";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import Dashboard from "@mui/icons-material/Dashboard";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import Dataset from "@mui/icons-material/Dataset";
import DatasetOutlined from "@mui/icons-material/DatasetOutlined";
import Description from "@mui/icons-material/Description";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EventNote from "@mui/icons-material/EventNote";
import EventNoteOutlined from "@mui/icons-material/EventNoteOutlined";
import Groups from "@mui/icons-material/Groups";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import Hub from "@mui/icons-material/Hub";
import HubOutlined from "@mui/icons-material/HubOutlined";
import MenuBook from "@mui/icons-material/MenuBook";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import ScatterPlot from "@mui/icons-material/ScatterPlot";
import ScatterPlotOutlined from "@mui/icons-material/ScatterPlotOutlined";
import Science from "@mui/icons-material/Science";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import Summarize from "@mui/icons-material/Summarize";
import SummarizeOutlined from "@mui/icons-material/SummarizeOutlined";
import Timeline from "@mui/icons-material/Timeline";
import TimelineOutlined from "@mui/icons-material/TimelineOutlined";
import Timer from "@mui/icons-material/Timer";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import TrackChanges from "@mui/icons-material/TrackChanges";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";

export type NavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  /** Filled variant shown when the item is the current page. */
  activeIcon: SvgIconComponent;
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
