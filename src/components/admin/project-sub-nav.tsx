"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatCircleDots,
  Clock,
  FileText,
  FolderOpen,
  NotePencil,
  Receipt,
  SquaresFour,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";

const SECTIONS = [
  { href: "board", label: "Board", icon: SquaresFour },
  { href: "decisions", label: "Decisions", icon: ChatCircleDots },
  { href: "files", label: "Files", icon: FolderOpen },
  { href: "meetings", label: "Meetings", icon: VideoCamera },
  { href: "updates", label: "Updates", icon: NotePencil },
  { href: "hours", label: "Hours", icon: Clock },
  { href: "invoices", label: "Invoices", icon: Receipt },
  { href: "contracts", label: "Contracts", icon: FileText },
];

/** Persistent per-project tab nav — mirrors AppShell's active-state styling so the
 * admin's project workspace feels as cohesive as the client portal's own sidebar. */
export function ProjectSubNav({ orgId, projectId }: { orgId: string; projectId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${orgId}/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-border pb-4">
      {SECTIONS.map(({ href, label, icon: ItemIcon }) => {
        const active = pathname === `${base}/${href}`;
        return (
          <Link
            key={href}
            href={`${base}/${href}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-muted hover:text-primary"
            }`}
          >
            <ItemIcon size={15} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
