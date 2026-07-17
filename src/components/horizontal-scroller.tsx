"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lets a vertical wheel gesture drive horizontal scroll while hovered, so
 * the row is exploreable without a trackpad or shift+wheel. Falls back to
 * native touch/scrollbar dragging untouched.
 */
export function HorizontalScroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
