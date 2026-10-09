import type { SvgIconComponent } from "@mui/icons-material";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import Insights from "@mui/icons-material/Insights";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import ViewKanban from "@mui/icons-material/ViewKanban";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import Inventory2 from "@mui/icons-material/Inventory2";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import FolderOpen from "@mui/icons-material/FolderOpen";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import Videocam from "@mui/icons-material/Videocam";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import Forum from "@mui/icons-material/Forum";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import EditNote from "@mui/icons-material/EditNote";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AccessTimeFilled from "@mui/icons-material/AccessTimeFilled";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import Groups from "@mui/icons-material/Groups";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import Description from "@mui/icons-material/Description";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import Dashboard from "@mui/icons-material/Dashboard";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import Business from "@mui/icons-material/Business";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";
import TrackChanges from "@mui/icons-material/TrackChanges";

export type NavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  /** Filled variant shown when the item is the current page. */
  activeIcon: SvgIconComponent;
};

export const PORTAL_NAV: NavItem[] = [
  { label: "Executive Summary", href: "/portal", icon: InsightsOutlined, activeIcon: Insights },
  { label: "Board", href: "/portal/board", icon: ViewKanbanOutlined, activeIcon: ViewKanban },
  { label: "Deliverables", href: "/portal/deliverables", icon: Inventory2Outlined, activeIcon: Inventory2 },
  { label: "Files", href: "/portal/files", icon: FolderOpenOutlined, activeIcon: FolderOpen },
  { label: "Meetings", href: "/portal/meetings", icon: VideocamOutlined, activeIcon: Videocam },
  { label: "Decisions", href: "/portal/decisions", icon: ForumOutlined, activeIcon: Forum },
  { label: "Updates", href: "/portal/updates", icon: EditNoteOutlined, activeIcon: EditNote },
  { label: "Hours", href: "/portal/hours", icon: AccessTimeOutlined, activeIcon: AccessTimeFilled },
  { label: "Team", href: "/portal/team", icon: GroupsOutlined, activeIcon: Groups },
  { label: "Invoices", href: "/portal/invoices", icon: ReceiptLongOutlined, activeIcon: ReceiptLong },
  { label: "Contracts", href: "/portal/contracts", icon: DescriptionOutlined, activeIcon: Description },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: DashboardOutlined, activeIcon: Dashboard },
  { label: "Clients", href: "/admin/clients", icon: BusinessOutlined, activeIcon: Business },
  { label: "Reports", href: "/admin/reports", icon: InsightsOutlined, activeIcon: Insights },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarMonthOutlined, activeIcon: CalendarMonth },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptLongOutlined, activeIcon: ReceiptLong },
  { label: "Contracts", href: "/admin/contracts", icon: DescriptionOutlined, activeIcon: Description },
  { label: "Prospects", href: "/admin/prospects", icon: TrackChangesOutlined, activeIcon: TrackChanges },
];
