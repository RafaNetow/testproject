"use client";

import { useEffect, useState } from "react";
import { MolecularAccent } from "@/components/molecular-accent";

/**
 * Greeting/date are computed client-side, after mount, using the visitor's
 * own local clock — computing them from the server's clock would show the
 * wrong time-of-day greeting depending on the gap between server and
 * visitor timezones, and SSR-ing a guess would risk a hydration mismatch
 * the moment the two disagree (the same class of bug fixed earlier for
 * date/currency formatting).
 */
export function DashboardHero({ name, subtitle }: { name?: string; subtitle: string }) {
  const [greeting, setGreeting] = useState("Welcome back");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setDateLabel(
      new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    );
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0e16] px-6 py-8 sm:px-10 sm:py-10">
      <MolecularAccent
        tone="bright"
        particleCount={40}
        desktopOnly={false}
        className="absolute inset-0 h-full w-full opacity-60"
      />
      <div className="relative z-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          {dateLabel || " "}
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium text-white sm:text-3xl">
          {greeting}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2 text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}
