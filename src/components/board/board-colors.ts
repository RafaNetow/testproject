/** Fixed, hash-assigned palette for labels and assignee avatars — consistent
 * per tag/person without needing a manual color-picker UI. */
const PALETTE = [
  { bg: "bg-sky-100 dark:bg-sky-500/15", text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400" },
  { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400" },
  { bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-rose-100 dark:bg-rose-500/15", text: "text-rose-700 dark:text-rose-400" },
  { bg: "bg-cyan-100 dark:bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-400" },
  { bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-teal-100 dark:bg-teal-500/15", text: "text-teal-700 dark:text-teal-400" },
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
