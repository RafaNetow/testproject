/**
 * Brand accents the admin can compare (accent-switcher.tsx). The CSS for each
 * lives in globals.css under `:root[data-accent=…]`; verdigris is the default.
 */
export const ACCENTS = [
  { key: "verdigris", name: "Verdigris", note: "Copper patina — current brand", swatch: "#2f7d6d" },
  { key: "prussian", name: "Prussian blue", note: "The first synthetic pigment, 1706", swatch: "#1f4e79" },
  { key: "cobalt", name: "Cobalt violet", note: "Cobalt phosphate pigment", swatch: "#6a4c93" },
  { key: "graphite", name: "Graphite", note: "Carbon — almost monochrome", swatch: "#2f3a38" },
] as const;

export type AccentKey = (typeof ACCENTS)[number]["key"];

export const ACCENT_COOKIE = "alchemica-accent";

/**
 * Runs in <head> before first paint so a saved accent never flashes the default.
 * Only known keys are applied.
 */
export const ACCENT_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${ACCENT_COOKIE}=([a-z]+)/);var k=m&&m[1];if(k&&${JSON.stringify(
  ACCENTS.filter((a) => a.key !== "verdigris").map((a) => a.key)
)}.indexOf(k)>-1)document.documentElement.setAttribute("data-accent",k);}catch(e){}})();`;
