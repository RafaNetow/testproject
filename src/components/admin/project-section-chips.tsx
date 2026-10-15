"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ExpandMore, AccessTimeOutlined, DescriptionOutlined, EditNoteOutlined, FolderOpenOutlined, ForumOutlined, Inventory2Outlined, ReceiptLongOutlined, VideocamOutlined, ViewKanbanOutlined, ChatOutlined } from "@/components/icons";

/** The day-to-day sections stay visible; the rest sit under "More". */
const PRIMARY_SECTIONS = [
  { href: "board", label: "Board", icon: ViewKanbanOutlined },
  { href: "messages", label: "Messages", icon: ChatOutlined },
  { href: "files", label: "Files", icon: FolderOpenOutlined },
  { href: "deliverables", label: "Deliverables", icon: Inventory2Outlined },
  { href: "updates", label: "Updates", icon: EditNoteOutlined },
];

const MORE_SECTIONS = [
  { href: "decisions", label: "Decisions", icon: ForumOutlined },
  { href: "meetings", label: "Meetings", icon: VideocamOutlined },
  { href: "hours", label: "Hours", icon: AccessTimeOutlined },
  { href: "invoices", label: "Invoices", icon: ReceiptLongOutlined },
  { href: "contracts", label: "Contracts", icon: DescriptionOutlined },
];

/**
 * Shortcut chips into a project's sections. A client component so the chip
 * icons are created here: an icon element handed over from a server component
 * arrives lazily, Chip doesn't recognise it during SSR, and hydration fails.
 */
const chipSx = { fontSize: 12, "&:hover": { borderColor: "primary.main", color: "primary.main", "& .MuiChip-icon": { color: "primary.main" } } } as const;

export function ProjectSectionChips({ orgId, projectId }: { orgId: string; projectId: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const base = `/admin/clients/${orgId}/projects/${projectId}`;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {PRIMARY_SECTIONS.map(({ href, label, icon: ItemIcon }) => (
        <Chip
          key={href}
          component={NextLink}
          href={`${base}/${href}`}
          clickable
          variant="outlined"
          icon={<ItemIcon sx={{ fontSize: 15 }} />}
          label={label}
          sx={chipSx}
        />
      ))}
      <Chip
        clickable
        variant="outlined"
        label="More"
        deleteIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        onDelete={(e) => setAnchor((e.currentTarget as HTMLElement).closest(".MuiChip-root") as HTMLElement)}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={chipSx}
      />
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {MORE_SECTIONS.map(({ href, label, icon: ItemIcon }) => (
          <MenuItem key={href} component={NextLink} href={`${base}/${href}`} onClick={() => setAnchor(null)} sx={{ fontSize: 14 }}>
            <ListItemIcon>
              <ItemIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
