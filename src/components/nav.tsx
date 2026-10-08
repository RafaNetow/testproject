"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "#services", label: "How it works" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

export function Nav({ forceSolid = false }: { forceSolid?: boolean }) {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [open, setOpen] = useState(false);
  const scrolled = forceSolid || scrolledPast;

  useEffect(() => {
    if (forceSolid) return;
    const onScroll = () => setScrolledPast(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceSolid]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a
          href="#top"
          className={`font-display text-xl tracking-tight transition-colors ${
            scrolled ? "text-primary" : "text-white"
          }`}
        >
          Alchemica
        </a>

        <div className="hidden items-center gap-10 md:flex">
          <ul className="flex items-center gap-9">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    scrolled ? "text-secondary" : "text-white/85"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className={`text-sm font-medium transition-colors hover:text-accent ${
              scrolled ? "text-secondary" : "text-white/85"
            }`}
          >
            Client Login
          </Link>

          <a
            href="#contact"
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Start a conversation
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
            scrolled ? "text-primary" : "text-white"
          }`}
        >
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-border bg-background md:hidden">
          <ul className="flex flex-col px-6 py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base font-medium text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block py-3 text-base font-medium text-primary"
              >
                Client Login
              </Link>
            </li>
            <li className="pt-2">
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="btn-primary block rounded-full px-5 py-3 text-center text-sm font-medium"
              >
                Start a conversation
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
