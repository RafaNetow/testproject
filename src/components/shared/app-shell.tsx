"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminSearch } from "@/components/shared/admin-search";
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

  const navList = (
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
                ? "bg-accent/10 text-accent"
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

  const userBlock = (
    <div className="border-t border-border px-6 py-5">
      <p className="truncate text-sm text-secondary">{userEmail}</p>
      <SignOutButton className="mt-1 inline-block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary" />
    </div>
  );

  return (
    <div className="app-shell flex min-h-dvh bg-muted">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="px-6 py-6">
          <Link href="/" className="font-display text-lg text-primary">
            {brandLabel}
          </Link>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {variant === "admin" && (
          <div className="px-3 pb-3">
            <AdminSearch />
          </div>
        )}
        {navList}
        {userBlock}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 lg:hidden">
          <Link href="/" className="font-display text-lg text-primary">
            {brandLabel}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-primary"
          >
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </header>

        {open && (
          <div className="border-b border-border bg-card lg:hidden">
            {variant === "admin" && (
              <div className="px-3 pt-3">
                <AdminSearch />
              </div>
            )}
            <div className="flex flex-col py-2">{navList}</div>
            {userBlock}
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
