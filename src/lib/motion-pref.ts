/**
 * "Animations" on/off from the Settings drawer, on top of the system's
 * "reduce motion". Off is stored in localStorage and applied as
 * `<html data-motion="reduced">`, which globals.css treats exactly like the
 * system setting. Kept outside client components so the root layout can
 * inline the boot script.
 */

export const MOTION_KEY = "alchemica-motion";
export const MOTION_ATTR = "data-motion";

/** Runs in <head> before the first paint, so a saved choice never flashes animations. */
export const MOTION_BOOT_SCRIPT = `(function(){try{if(localStorage.getItem("${MOTION_KEY}")==="reduced")document.documentElement.setAttribute("${MOTION_ATTR}","reduced");}catch(e){}})();`;

/** True when animations should be skipped: the system setting or the Settings switch. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.getAttribute(MOTION_ATTR) === "reduced"
  );
}

/** Saves the Settings switch and applies it right away. */
export function setAnimationsEnabled(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.removeAttribute(MOTION_ATTR);
  else root.setAttribute(MOTION_ATTR, "reduced");
  try {
    if (enabled) localStorage.removeItem(MOTION_KEY);
    else localStorage.setItem(MOTION_KEY, "reduced");
  } catch {
    // Private mode: the choice lasts for this page only.
  }
}
