"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MOTION_ATTR, prefersReducedMotion } from "@/lib/motion-pref";
import { whenRevealed } from "@/lib/route-loader";

/** True once the page loader has lifted, so an animation plays where it can be seen. */
export function useRevealed(): boolean {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => whenRevealed(() => setRevealed(true)), []);
  return revealed;
}

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [MOTION_ATTR] });
  return () => {
    mq.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/** The system's "reduce motion" or Settings → Animations off; updates live. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
}

/**
 * The portal's colour tokens as real colour values, for libraries that draw
 * SVG attributes themselves (charts). Read after mount, so they follow the
 * chosen accent and light/dark mode.
 */
export function useTokenColors<K extends string>(tokens: Record<K, string>): Record<K, string> | null {
  const [colors, setColors] = useState<Record<K, string> | null>(null);
  const key = JSON.stringify(tokens);
  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      const out = {} as Record<K, string>;
      for (const [name, token] of Object.entries(tokens) as [K, string][]) {
        out[name] = token.startsWith("--") ? style.getPropertyValue(token).trim() || "#888" : token;
      }
      setColors(out);
    };
    const raf = requestAnimationFrame(read);
    // The accent or dark mode can change while the page is open.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      mq.removeEventListener("change", read);
    };
    // `key` stands in for `tokens`, which callers usually pass inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return colors;
}
