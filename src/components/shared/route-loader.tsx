"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import { GearLoader } from "@/components/shared/gear-loader";
import { MIN_LOADER_MS, ROUTE_LOADING_ATTR, SPLASH_MS, SPLASH_SEEN_KEY } from "@/lib/route-loader";
import { prefersReducedMotion } from "@/lib/motion-pref";

const SAFETY_MS = 15_000;
const FADE_MS = 260;

// One shell per page, so the timers can live at module level.
let timers: number[] = [];
let shownAt = 0;

function setState(value: "on" | "splash" | "leaving" | null) {
  if (value) document.documentElement.setAttribute(ROUTE_LOADING_ATTR, value);
  else document.documentElement.removeAttribute(ROUTE_LOADING_ATTR);
}
function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
}
function later(fn: () => void, ms: number) {
  timers.push(window.setTimeout(fn, ms));
}
function hide() {
  clearTimers();
  setState("leaving");
  later(() => {
    if (document.documentElement.getAttribute(ROUTE_LOADING_ATTR) === "leaving") setState(null);
  }, FADE_MS);
}
function reducedMotion() {
  return prefersReducedMotion();
}

/**
 * Drives the page-change loader (renders nothing; see RouteLoaderOverlay).
 *
 * Clicking an internal link shows the loader at once; it stays until the new
 * page has arrived and at least MIN_LOADER_MS, then fades out — and the page's
 * entrance plays as it lifts (CSS pauses entrances while it shows). The first
 * page of a browser session gets a short splash, started before paint by the
 * boot script in the root layout. With "reduce motion": no splash and no
 * minimum time. Needs a Suspense boundary (useSearchParams).
 */
export function RouteLoaderController() {
  const here = `${usePathname()}?${useSearchParams().toString()}`;
  // The address we were on when a page change began.
  const from = useRef<string | null>(null);

  useEffect(() => {
    if (document.documentElement.getAttribute(ROUTE_LOADING_ATTR) === "splash") {
      try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      } catch {
        // Private mode: the splash just shows again next time.
      }
      shownAt = performance.now();
      later(hide, SPLASH_MS);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Route handlers (exports, integrations) aren't pages.
      if (url.pathname.startsWith("/api/")) return;
      const next = `${url.pathname}?${url.searchParams.toString()}`;
      const current = `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`;
      if (next === current) return;
      clearTimers();
      from.current = current;
      shownAt = performance.now();
      setState("on");
      later(hide, SAFETY_MS);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
      setState(null);
    };
  }, []);

  // Arrived: hide once the minimum time is up.
  useEffect(() => {
    if (!from.current || here === from.current) return;
    from.current = null;
    const min = reducedMotion() ? 0 : MIN_LOADER_MS;
    clearTimers();
    later(hide, Math.max(0, min - (performance.now() - shownAt)));
  }, [here]);

  return null;
}

/**
 * The loader itself, over the content area (sidebar and top bar stay usable).
 * Always in the server HTML and shown purely by CSS from the <html> attribute,
 * so the first-visit splash is there before any JavaScript runs.
 */
export function RouteLoaderOverlay({ top, left }: { top: object; left: object }) {
  return (
    <Box
      className="route-loader"
      sx={{
        position: "fixed",
        top,
        left,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar - 1,
        bgcolor: "background.default",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GearLoader delayMs={0} />
    </Box>
  );
}
