/** Fixed, hash-assigned palette for labels and assignee avatars — consistent
 * per tag/person without needing a manual color-picker UI. `light-dark()`
 * picks the right shade from the page's color-scheme, which the portal sets
 * to dark under `prefers-color-scheme: dark`. */
const PALETTE = [
  { bg: "light-dark(#e0f2fe, rgb(14 165 233 / 0.15))", text: "light-dark(#0369a1, #38bdf8)" },
  { bg: "light-dark(#d1fae5, rgb(16 185 129 / 0.15))", text: "light-dark(#047857, #34d399)" },
  { bg: "light-dark(#fef3c7, rgb(245 158 11 / 0.15))", text: "light-dark(#b45309, #fbbf24)" },
  { bg: "light-dark(#ede9fe, rgb(139 92 246 / 0.15))", text: "light-dark(#6d28d9, #a78bfa)" },
  { bg: "light-dark(#ffe4e6, rgb(244 63 94 / 0.15))", text: "light-dark(#be123c, #fb7185)" },
  { bg: "light-dark(#cffafe, rgb(6 182 212 / 0.15))", text: "light-dark(#0e7490, #22d3ee)" },
  { bg: "light-dark(#ffedd5, rgb(249 115 22 / 0.15))", text: "light-dark(#c2410c, #fb923c)" },
  { bg: "light-dark(#ccfbf1, rgb(20 184 166 / 0.15))", text: "light-dark(#0f766e, #2dd4bf)" },
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function colorFor(text: string) {
  return PALETTE[hash(text) % PALETTE.length];
}

export function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}
