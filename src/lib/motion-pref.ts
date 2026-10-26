/**
 * "Animations" on/off from the Settings drawer, on top of the system's
 * "reduce motion". Off is stored in localStorage and applied as
 * `<html data-motion="reduced">`, which globals.css treats exactly like the
 * system setting. Kept outside client components so the root layout can
 * inline the boot script.
 */

export const MOTION_KEY = "alchemica-motion";
export const MOTION_ATTR = "data-motion";

/** Which loading animation: the gears (default, no attribute) or just the bar and messages. */
export const LOADER_KEY = "alchemica-loader";
export const LOADER_ATTR = "data-loader";

/** The Settings choice: gears, bar and messages, or nothing moving. */
export type MotionChoice = "gears" | "bar" | "off";

/** Runs in <head> before the first paint, so a saved choice never flashes animations or the wrong loader. */
export const MOTION_BOOT_SCRIPT = `(function(){try{var r=document.documentElement;if(localStorage.getItem("${MOTION_KEY}")==="reduced")r.setAttribute("${MOTION_ATTR}","reduced");if(localStorage.getItem("${LOADER_KEY}")==="bar")r.setAttribute("${LOADER_ATTR}","bar");}catch(e){}})();`;

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

/** The choice currently applied to the page. */
export function getMotionChoice(): MotionChoice {
  const root = document.documentElement;
  if (root.getAttribute(MOTION_ATTR) === "reduced") return "off";
  return root.getAttribute(LOADER_ATTR) === "bar" ? "bar" : "gears";
}

/** Saves the Settings choice and applies it right away. "Off" keeps the loader style for when motion comes back. */
export function setMotionChoice(choice: MotionChoice) {
  setAnimationsEnabled(choice !== "off");
  if (choice === "off") return;
  const root = document.documentElement;
  if (choice === "bar") root.setAttribute(LOADER_ATTR, "bar");
  else root.removeAttribute(LOADER_ATTR);
  try {
    if (choice === "bar") localStorage.setItem(LOADER_KEY, "bar");
    else localStorage.removeItem(LOADER_KEY);
  } catch {
    // Private mode: the choice lasts for this page only.
  }
}
