"use client";

import { useEffect, useState } from "react";

/**
 * A number that counts up from 0 when it first appears. The server renders
 * the real value (no layout shift, works without JS); the count starts on the
 * first animation frame. With "reduce motion" it just shows the value.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1100,
  delay = 250,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
}) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  return (
    <>
      {shown}
      {suffix}
    </>
  );
}
