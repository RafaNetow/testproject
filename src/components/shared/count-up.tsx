"use client";

import { useEffect, useState } from "react";
import { whenRevealed } from "@/lib/route-loader";
import { prefersReducedMotion } from "@/lib/motion-pref";
import { formatMoney } from "@/lib/money";

/**
 * A number that counts up from 0 when it first appears. The server renders
 * the real value (no layout shift, works without JS); the count starts once
 * the page loader has lifted. With "reduce motion" it just shows the value.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1100,
  delay = 250,
  currency,
  decimals = 0,
}: {
  /** With `currency`, the value is in cents and shows as money ("DKK 12,500"). */
  value: number;
  suffix?: string;
  currency?: string;
  /** Digits after the decimal point (e.g. 1 for "12.5" hours). */
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion() || value === 0) return;
    let raf = 0;
    const cancelReveal = whenRevealed((revealedAt) => {
      const start = revealedAt + delay;
      const tick = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - start) / duration));
        const f = Math.pow(10, decimals);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3)) * f) / f);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelReveal();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay, decimals]);

  return (
    <>
      {currency ? formatMoney(shown, currency, { whole: true }) : decimals ? shown.toFixed(decimals) : shown}
      {suffix}
    </>
  );
}
