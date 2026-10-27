/**
 * Light / dark / system from the Settings drawer. The page always carries the
 * resolved mode as `<html data-mode="light|dark">`, which globals.css uses for
 * the app shell's dark tokens. The choice is stored in localStorage; "system"
 * (no stored value) follows the operating system and updates live. Kept
 * outside client components so the root layout can inline the boot script.
 */

export const MODE_KEY = "alchemica-mode";
export const MODE_ATTR = "data-mode";

export type ModeChoice = "light" | "dark" | "system";

/** Runs in <head> before the first paint, so the page never flashes the wrong mode. */
export const MODE_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem("${MODE_KEY}");var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("${MODE_ATTR}",d?"dark":"light");}catch(e){}})();`;

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readChoice(): ModeChoice {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(choice: ModeChoice) {
  const dark = choice === "dark" || (choice === "system" && systemIsDark());
  document.documentElement.setAttribute(MODE_ATTR, dark ? "dark" : "light");
}

/** The choice currently saved on this browser. */
export function getModeChoice(): ModeChoice {
  return readChoice();
}

/** Saves the Settings choice and applies it right away. */
export function setModeChoice(choice: ModeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(MODE_KEY);
    else localStorage.setItem(MODE_KEY, choice);
  } catch {
    // Private mode: the choice lasts for this page only.
  }
  apply(choice);
}

/** While the choice is "system", follow the operating system as it changes. Returns the unsubscribe. */
export function followSystemMode(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readChoice() === "system") apply("system");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
