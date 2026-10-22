/**
 * Shared settings for the gear loader that covers the content while a page
 * changes. Kept outside the client components so the root layout (a server
 * component) can inline the boot script.
 *
 * The loader is driven by an attribute on <html>:
 *   data-route-loading="splash"   first visit in this browser session
 *   data-route-loading="on"       a page change is in flight
 *   data-route-loading="leaving"  fading out
 * CSS shows the loader and pauses page entrances while it is "splash" or "on".
 */

/** The loader stays at least this long on every page change, so it can be seen. */
export const MIN_LOADER_MS = 1200;

/** How long the first-visit splash stays. */
export const SPLASH_MS = 1400;

export const ROUTE_LOADING_ATTR = "data-route-loading";
export const SPLASH_SEEN_KEY = "alchemica-splash-seen";

/**
 * Runs in <head> before the first paint: on the first portal/admin page of a
 * browser session it turns the splash on, so the loader is there from the very
 * first frame instead of popping in after hydration. Skipped with "reduce motion".
 */
export const SPLASH_BOOT_SCRIPT = `(function(){try{if(!/^\\/(portal|admin)(\\/|$)/.test(location.pathname))return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("${SPLASH_SEEN_KEY}"))return;document.documentElement.setAttribute("${ROUTE_LOADING_ATTR}","splash");}catch(e){}})();`;

/** True while the loader covers the page (entrances should wait). */
export function routeIsLoading(): boolean {
  const v = document.documentElement.getAttribute(ROUTE_LOADING_ATTR);
  return v === "on" || v === "splash";
}

/**
 * Calls `fn` on the first animation frame after the loader has lifted (right
 * away if it isn't showing). Returns a cancel function.
 */
export function whenRevealed(fn: (now: number) => void): () => void {
  let raf = 0;
  const check = (now: number) => {
    if (routeIsLoading()) raf = requestAnimationFrame(check);
    else fn(now);
  };
  raf = requestAnimationFrame(check);
  return () => cancelAnimationFrame(raf);
}
