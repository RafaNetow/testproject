"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#approach", label: "Approach" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

        <ul className="hidden items-center gap-9 md:flex">
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
          className={`hidden text-sm font-medium transition-colors hover:text-accent md:inline-block ${
            scrolled ? "text-secondary" : "text-white/85"
          }`}
        >
          Client Login
        </Link>

        <a
          href="#contact"
          className="btn-primary hidden rounded-full px-5 py-2.5 text-sm font-medium md:inline-block"
        >
          Start a conversation
        </a>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
            scrolled ? "text-primary" : "text-white"
          }`}
        >
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
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
