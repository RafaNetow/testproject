"use client";

/**
 * The portal's one icon set: Phosphor, the same family the marketing site
 * uses, drawn at the light weight. Exports keep the Material names the code
 * already used so call sites only change their import; swapping a glyph or
 * the weight for the whole app happens here.
 *
 * Each icon sizes from `font-size` like an MUI SvgIcon, so `sx={{ fontSize }}`,
 * `fontSize="small"` and MUI's icon slots (Chip, ListItemIcon, Alert…) keep working.
 */
import { forwardRef, type ComponentType } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { IconProps as PhosphorProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bell,
  Briefcase,
  Buildings,
  CalendarBlank,
  CalendarDots,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartLine,
  ChartScatter,
  ChatCircle,
  ChatsCircle,
  Check as PhCheck,
  CheckCircle,
  Checks,
  ClipboardText,
  Clock,
  CloudArrowUp,
  Copy,
  Database,
  DownloadSimple,
  Eye,
  FilePlus,
  FileText,
  Flask,
  Folder as PhFolder,
  FolderOpen,
  FolderPlus,
  GearSix,
  Graph,
  House,
  Info,
  Kanban,
  LinkSimple,
  List,
  MagnifyingGlass,
  NotePencil,
  Package,
  PaperPlaneRight,
  Paperclip,
  PencilSimple,
  Plus,
  Question,
  Receipt,
  SignOut,
  Signature,
  SquaresFour,
  Target,
  Timer as PhTimer,
  Trash,
  UploadSimple,
  UsersThree,
  VideoCamera,
  WarningCircle,
  Wrench,
  X,
} from "@phosphor-icons/react/dist/ssr";

export type IconProps = {
  sx?: SxProps<Theme>;
  fontSize?: "inherit" | "small" | "medium" | "large";
  className?: string;
  color?: string;
  titleAccess?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
};

export type IconComponent = ComponentType<IconProps>;

const FONT_SIZE = { inherit: "inherit", small: "1.25rem", medium: "1.5rem", large: "2.1875rem" } as const;

function icon(Glyph: ComponentType<PhosphorProps>, weight: IconWeight = "light"): IconComponent {
  const Icon = forwardRef<SVGSVGElement, IconProps & { ownerState?: unknown }>(function Icon(
    // MUI slots (Tabs scroll buttons, Select) pass their ownerState; it must not reach the <svg>.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { sx, fontSize = "medium", titleAccess, color, ownerState, ...rest },
    ref
  ) {
    return (
      <Box
        component={Glyph}
        ref={ref}
        weight={weight}
        size="1em"
        aria-hidden={titleAccess ? undefined : true}
        {...(titleAccess ? { role: "img", "aria-label": titleAccess } : {})}
        {...rest}
        sx={[
          { display: "inline-block", flexShrink: 0, fontSize: FONT_SIZE[fontSize], color: color ?? "inherit", verticalAlign: "middle" },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  });
  // MUI slots (Button start/end icons, InputAdornment…) treat it like their own SvgIcon.
  (Icon as unknown as { muiName: string }).muiName = "SvgIcon";
  return Icon as unknown as IconComponent;
}

// Actions & navigation
export const Add = icon(Plus);
export const Close = icon(X);
export const Check = icon(PhCheck);
export const DoneAll = icon(Checks);
export const Menu = icon(List);
export const Search = icon(MagnifyingGlass);
export const ExpandMore = icon(CaretDown);
export const NavigateNext = icon(CaretRight);
export const ArrowBack = icon(CaretLeft);
export const ArrowUpward = icon(ArrowUp);
export const ArrowDownward = icon(ArrowDown);
export const ArrowForward = icon(ArrowRight);
export const Replay = icon(ArrowCounterClockwise);
export const Link = icon(LinkSimple);
export const ContentCopy = icon(Copy);
export const AttachFile = icon(Paperclip);
export const EditOutlined = icon(PencilSimple);
export const EditNoteOutlined = icon(NotePencil);
export const DeleteOutlined = icon(Trash);
export const Send = icon(PaperPlaneRight);
export const SendOutlined = icon(PaperPlaneRight);
export const Download = icon(DownloadSimple);
export const FileDownloadOutlined = icon(DownloadSimple);
export const UploadFileOutlined = icon(UploadSimple);
export const CloudUploadOutlined = icon(CloudArrowUp);
export const VisibilityOutlined = icon(Eye);
export const LogoutOutlined = icon(SignOut);
export const SettingsOutlined = icon(GearSix);
export const HomeOutlined = icon(House);
export const NotificationsNoneOutlined = icon(Bell);

// Status
export const CheckCircleOutlined = icon(CheckCircle);
export const TaskAltOutlined = icon(CheckCircle);
export const ErrorOutlined = icon(WarningCircle);
export const InfoOutlined = icon(Info);
export const HelpOutlineOutlined = icon(Question);
export const ScheduleOutlined = icon(Clock);
export const AccessTime = icon(Clock);
export const AccessTimeOutlined = icon(Clock);

// Things
export const Folder = icon(PhFolder);
export const FolderOutlined = icon(PhFolder);
export const FolderOpenOutlined = icon(FolderOpen);
export const CreateNewFolderOutlined = icon(FolderPlus);
export const NoteAddOutlined = icon(FilePlus);
export const ChatBubbleOutlined = icon(ChatCircle);
export const ForumOutlined = icon(ChatsCircle);
export const Inventory = icon(Package);
export const Inventory2Outlined = icon(Package);
export const VideocamOutlined = icon(VideoCamera);
export const ViewKanbanOutlined = icon(Kanban);
export const BuildOutlined = icon(Wrench);
export const WorkOutlineOutlined = icon(Briefcase);

// Sidebar sections: outlined at rest, filled for the current page.
export const BusinessOutlined = icon(Buildings);
export const Business = icon(Buildings, "fill");
export const CalendarMonthOutlined = icon(CalendarBlank);
export const CalendarMonth = icon(CalendarBlank, "fill");
export const DashboardOutlined = icon(SquaresFour);
export const Dashboard = icon(SquaresFour, "fill");
export const DatasetOutlined = icon(Database);
export const Dataset = icon(Database, "fill");
export const DescriptionOutlined = icon(FileText);
export const Description = icon(FileText, "fill");
export const DrawOutlined = icon(Signature);
export const Draw = icon(Signature, "fill");
export const EventNoteOutlined = icon(CalendarDots);
export const EventNote = icon(CalendarDots, "fill");
export const GroupsOutlined = icon(UsersThree);
export const Groups = icon(UsersThree, "fill");
export const HubOutlined = icon(Graph);
export const Hub = icon(Graph, "fill");
export const MenuBookOutlined = icon(BookOpen);
export const MenuBook = icon(BookOpen, "fill");
export const ReceiptLongOutlined = icon(Receipt);
export const ReceiptLong = icon(Receipt, "fill");
export const ScatterPlotOutlined = icon(ChartScatter);
export const ScatterPlot = icon(ChartScatter, "fill");
export const ScienceOutlined = icon(Flask);
export const Science = icon(Flask, "fill");
export const SummarizeOutlined = icon(ClipboardText);
export const Summarize = icon(ClipboardText, "fill");
export const TimelineOutlined = icon(ChartLine);
export const Timeline = icon(ChartLine, "fill");
export const TimerOutlined = icon(PhTimer);
export const Timer = icon(PhTimer, "fill");
export const TrackChangesOutlined = icon(Target);
export const TrackChanges = icon(Target, "fill");
