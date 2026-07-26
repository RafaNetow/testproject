import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MolecularAccent } from "@/components/molecular-accent";

/**
 * The slim, dark, molecular-network-branded header used across every
 * top-level admin/portal page — the same visual language as DashboardHero,
 * just shorter, since a full-height greeting banner on every single work
 * page (Board, Files, Invoices…) would be more motion than a data-dense
 * screen should carry.
 */
export function SectionHeader({
  eyebrow,
  title,
  titleExtra,
  subtitle,
  actions,
  backLink,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Rendered inline next to the title — e.g. a status pill. */
  titleExtra?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backLink?: { href: string; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0e16] px-6 py-6 sm:px-8">
      <MolecularAccent
        tone="bright"
        particleCount={20}
        desktopOnly={false}
        className="absolute inset-0 h-full w-full opacity-40"
      />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          {backLink && (
            <Link
              href={backLink.href}
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft size={16} />
              {backLink.label}
            </Link>
          )}
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7dd3fc]">
              {eyebrow}
            </p>
          )}
          <div className={`flex flex-wrap items-center gap-3 ${eyebrow ? "mt-2" : ""}`}>
            <h1 className="font-display text-2xl font-medium text-white">{title}</h1>
            {titleExtra}
          </div>
          {subtitle && <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
