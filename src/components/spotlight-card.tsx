"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

/**
 * Wraps card content with a radial glow that tracks the cursor — pure CSS
 * custom properties updated on mousemove, no React state/re-renders.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={`spotlight-card ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
