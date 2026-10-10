/**
 * The portal's colour standard, in one place.
 *
 * - Brand: a single primary (`--color-accent`, petrol blue) for actions,
 *   navigation and progress.
 * - Status: success / warning / error / info, for state only — never as
 *   decoration (in a chemistry context red reads as hazard).
 * - Categories: the Okabe–Ito palette (`--cat-1`…`--cat-8`), colour-blind safe
 *   and familiar from scientific figures, for tags, avatars, file types.
 *
 * Colours are CSS variables (globals.css), so light and dark mode come free.
 */

export type Tone = {
  /** Soft tinted background for labels and icon chips. */
  bg: string;
  /** Text on that background — darkened (light mode) or lifted (dark mode) to keep AA contrast. */
  text: string;
  /** The colour itself, for icons, bars and dots. */
  solid: string;
};

export function tone(cssVar: string): Tone {
  const c = `var(${cssVar})`;
  return {
    bg: `color-mix(in srgb, ${c} 14%, transparent)`,
    text: `light-dark(color-mix(in srgb, ${c} 50%, black), color-mix(in srgb, ${c} 60%, white))`,
    solid: c,
  };
}

const NEUTRAL: Tone = {
  bg: "rgb(145 158 171 / 0.16)",
  text: "var(--color-secondary)",
  solid: "var(--color-muted-foreground)",
};

export const STATUS_TONE = {
  success: tone("--color-success"),
  warning: tone("--color-warning"),
  error: tone("--color-error"),
  info: tone("--color-info"),
  primary: tone("--color-accent"),
  neutral: NEUTRAL,
} as const;

export type StatusToneName = keyof typeof STATUS_TONE;

const CATEGORIES = Array.from({ length: 8 }, (_, i) => tone(`--cat-${i + 1}`));

/** The i-th category colour, wrapping around. */
export function category(index: number): Tone {
  return CATEGORIES[((index % CATEGORIES.length) + CATEGORIES.length) % CATEGORIES.length];
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** A stable category colour per key — the same tag or person always gets the same hue. */
export function categorical(key: string): Tone {
  return category(hash(key));
}

/** Lab-notebook figures: monospaced, tabular digits, so numbers line up and read as measurements. */
export const figureSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.02em",
} as const;
