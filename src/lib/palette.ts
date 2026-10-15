/**
 * The portal's colour standard, in one place.
 *
 * Minimal: one accent and greys. Colour only appears when it means something.
 *
 * - Brand: a single accent (`--color-accent`, verdigris) for actions,
 *   navigation and the current stage.
 * - Attention: warning (amber) and error (vermillion) — the only status hues,
 *   so anything coloured is something that needs a person.
 * - Everything else — done, sent, in progress, upcoming, tags, techniques,
 *   avatars — is neutral grey. Status labels keep their icon, so state never
 *   rests on colour alone.
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
  bg: "var(--fill-neutral, rgb(145 158 171 / 0.16))",
  text: "var(--color-secondary)",
  solid: "var(--color-muted-foreground)",
};

/** Finished work: quiet, but solid enough to read as "done" on bars and step markers. */
const DONE: Tone = {
  bg: NEUTRAL.bg,
  text: "var(--color-secondary)",
  solid: "var(--color-secondary)",
};

export const STATUS_TONE = {
  success: DONE,
  warning: tone("--color-warning"),
  error: tone("--color-error"),
  info: NEUTRAL,
  primary: tone("--color-accent"),
  neutral: NEUTRAL,
} as const;

export type StatusToneName = keyof typeof STATUS_TONE;

/** Categories (tags, techniques, avatars) are told apart by their text, not by hue. */
export function category(index: number): Tone {
  void index;
  return NEUTRAL;
}

/** Kept as the single entry point, so categories could get hues back in one place. */
export function categorical(key: string): Tone {
  void key;
  return NEUTRAL;
}

/** Lab-notebook figures: monospaced, tabular digits, so numbers line up and read as measurements. */
export const figureSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.02em",
} as const;
