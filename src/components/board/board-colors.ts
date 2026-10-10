import { categorical } from "@/lib/palette";

/** Hash-assigned category colour for labels and assignee avatars — consistent
 * per tag/person without a manual colour picker. Uses the Okabe–Ito category
 * palette from src/lib/palette.ts. */
export const colorFor = categorical;

export function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}
