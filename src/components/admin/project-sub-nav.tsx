"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { ViewKanbanOutlined, Inventory2Outlined, ForumOutlined, FolderOpenOutlined, VideocamOutlined, EditNoteOutlined, AccessTimeOutlined, ReceiptLongOutlined, DescriptionOutlined } from "@/components/icons";

const SECTIONS = [
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

/** Per-project section tabs in the admin's project workspace. */
export function ProjectSubNav({ orgId, projectId }: { orgId: string; projectId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${orgId}/projects/${projectId}`;
  const active = SECTIONS.find((s) => pathname === `${base}/${s.href}`)?.href ?? false;

  return (
    <Tabs
      value={active}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Project sections"
      sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44 }}
    >
      {SECTIONS.map(({ href, label, icon: ItemIcon }) => (
        <Tab
          key={href}
          value={href}
          component={Link}
          href={`${base}/${href}`}
          label={label}
          icon={<ItemIcon sx={{ fontSize: 17 }} />}
          iconPosition="start"
          sx={{ minHeight: 44, textTransform: "none", fontSize: 14, fontWeight: 500, gap: 0.75, px: 1.75 }}
        />
      ))}
    </Tabs>
  );
}
