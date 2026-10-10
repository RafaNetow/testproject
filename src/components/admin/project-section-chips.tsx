"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";

const PROJECT_SECTIONS = [
  { href: "board", label: "Board", icon: ViewKanbanOutlined },
  { href: "deliverables", label: "Deliverables", icon: Inventory2Outlined },
  { href: "decisions", label: "Decisions", icon: ForumOutlined },
  { href: "files", label: "Files", icon: FolderOpenOutlined },
  { href: "meetings", label: "Meetings", icon: VideocamOutlined },
  { href: "updates", label: "Updates", icon: EditNoteOutlined },
  { href: "hours", label: "Hours", icon: AccessTimeOutlined },
  { href: "invoices", label: "Invoices", icon: ReceiptLongOutlined },
  { href: "contracts", label: "Contracts", icon: DescriptionOutlined },
];

/**
 * Shortcut chips into a project's sections. A client component so the chip
 * icons are created here: an icon element handed over from a server component
 * arrives lazily, Chip doesn't recognise it during SSR, and hydration fails.
 */
export function ProjectSectionChips({ orgId, projectId }: { orgId: string; projectId: string }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {PROJECT_SECTIONS.map(({ href, label, icon: ItemIcon }) => (
        <Chip
          key={href}
          component={NextLink}
          href={`/admin/clients/${orgId}/projects/${projectId}/${href}`}
          clickable
          variant="outlined"
          icon={<ItemIcon sx={{ fontSize: 15 }} />}
          label={label}
          sx={{ fontSize: 12, "&:hover": { borderColor: "primary.main", color: "primary.main", "& .MuiChip-icon": { color: "primary.main" } } }}
        />
      ))}
    </Box>
  );
}
