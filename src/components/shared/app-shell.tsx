"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminSearch } from "@/components/shared/admin-search";
import { MolecularAccent } from "@/components/molecular-accent";
import { PORTAL_NAV, ADMIN_NAV } from "@/lib/nav-items";

type AppShellProps = {
  variant: "portal" | "admin";
  brandLabel: string;
  subtitle: string;
  userEmail: string;
  children: ReactNode;
};

/**
 * Shared sidebar + topbar chrome for both the client portal and admin
 * console — parameterized rather than forked, so the two surfaces stay
 * visually and behaviorally consistent. Nav items (which carry icon
 * component references) are looked up here rather than passed as a prop,
 * since functions can't cross the Server->Client Component boundary.
 */
export function AppShell({ variant, brandLabel, subtitle, userEmail, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = variant === "portal" ? PORTAL_NAV : ADMIN_NAV;

  const isActive = (href: string) =>
    href === pathname || (href !== "/portal" && href !== "/admin" && pathname.startsWith(href));

  const navList = (dark: boolean) => (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map(({ label, href, icon: ItemIcon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? dark
                  ? "bg-white/10 text-[#7dd3fc]"
                  : "bg-accent/10 text-accent"
                : dark
                  ? "text-white/60 hover:bg-white/5 hover:text-white"
                  : "text-secondary hover:bg-muted hover:text-primary"
            }`}
          >
            <ItemIcon size={18} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (dark: boolean) => (
    <div className={`border-t px-6 py-5 ${dark ? "border-white/10" : "border-border"}`}>
      <p className={`truncate text-sm ${dark ? "text-white/50" : "text-secondary"}`}>
        {userEmail}
      </p>
      <SignOutButton
        className={`mt-1 inline-block py-3 text-sm font-medium transition-colors ${
          dark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-primary"
        }`}
      />
    </div>
  );

  return (
    <div className="app-shell flex min-h-dvh bg-muted">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0a0e16] lg:flex">
        <div className="relative h-44 shrink-0 overflow-hidden">
          <MolecularAccent className="absolute inset-0 h-full w-full opacity-50" />
          <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-6">
            <Link href="/" className="font-display text-lg text-white">
              {brandLabel}
            </Link>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
              {subtitle}
            </p>
          </div>
        </div>
        {variant === "admin" && (
          <div className="px-3 pb-3 pt-3">
            <AdminSearch />
          </div>
        )}
        {navList(true)}
        {userBlock(true)}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-[#0a0e16] px-6 py-4 lg:hidden">
          <Link href="/" className="font-display text-lg text-white">
            {brandLabel}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-white"
          >
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </header>

        {open && (
          <div className="bg-[#0a0e16] lg:hidden">
            {variant === "admin" && (
              <div className="px-3 pt-3">
                <AdminSearch />
              </div>
            )}
            <div className="flex flex-col py-2">{navList(true)}</div>
            {userBlock(true)}
          </div>
        )}

        <main
          key={pathname}
          className="app-shell-main flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
