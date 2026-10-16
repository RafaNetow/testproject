"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LinearProgress from "@mui/material/LinearProgress";
import { keyframes } from "@mui/material/styles";

// Waits a beat before appearing, so instant navigations never flash a bar.
const appear = keyframes`from { opacity: 0 } to { opacity: 1 }`;

const SAFETY_MS = 20_000;

/**
 * A thin progress bar across the top while a page change is loading. Clicking
 * an internal link starts it; it ends by itself when the address changes, so
 * there is no timer to get wrong. If a click leads nowhere it gives up after
 * a safety delay.
 */
export function NavigationProgress() {
  const here = `${usePathname()}?${useSearchParams().toString()}`;
  // The address we were on when a navigation began. While it is still the
  // current one, a navigation is in flight; once it changes, we have arrived.
  const [from, setFrom] = useState<string | null>(null);
  const active = from !== null && from === here;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}?${url.searchParams.toString()}`;
      const current = `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`;
      if (next === current) return;
      setFrom(current);
      window.setTimeout(() => setFrom(null), SAFETY_MS);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!active) return null;
  return (
    <LinearProgress
      aria-label="Loading page"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (t) => t.zIndex.snackbar + 1,
        bgcolor: "transparent",
        opacity: 0,
        animation: `${appear} 0.2s 0.15s forwards`,
      }}
    />
  );
}
