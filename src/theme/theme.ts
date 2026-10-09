"use client";

import NextLink from "next/link";
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypeText {
    /** Quieter than `secondary` — meta lines, hints, timestamps. */
    muted: string;
  }
  interface Palette {
    navy: Palette["primary"];
  }
  interface PaletteOptions {
    navy?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    navy: true;
  }
}

/**
 * The palette points at the brand's CSS custom properties (globals.css)
 * instead of hard-coded hex values. `nativeColor` lets MUI derive hover,
 * alpha and contrast shades from them with CSS relative colors, so:
 *  - there is one source of truth for the brand colours, and
 *  - the portal/admin dark mode (which swaps those properties under
 *    `prefers-color-scheme: dark`) keeps working without a second theme.
 */
const v = (name: string) => `var(--${name})`;

export const theme = createTheme({
  cssVariables: { nativeColor: true },
  breakpoints: {
    // Same breakpoints the Tailwind layout was designed around.
    values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
  },
  palette: {
    primary: {
      main: v("color-accent"),
      dark: `color-mix(in srgb, ${v("color-accent")} 78%, black)`,
      light: `color-mix(in srgb, ${v("color-accent")} 70%, white)`,
      contrastText: v("color-accent-foreground"),
    },
    navy: {
      main: v("color-primary"),
      dark: `color-mix(in srgb, ${v("color-primary")} 85%, black)`,
      light: `color-mix(in srgb, ${v("color-primary")} 80%, white)`,
      contrastText: v("color-primary-foreground"),
    },
    secondary: {
      main: v("color-secondary"),
      contrastText: v("color-primary-foreground"),
    },
    error: {
      main: v("color-destructive"),
      contrastText: v("color-destructive-foreground"),
    },
    text: {
      primary: v("color-primary"),
      secondary: v("color-secondary"),
      muted: v("color-muted-foreground"),
    },
    background: {
      default: v("background"),
      paper: v("color-card"),
    },
    divider: v("color-border"),
    action: {
      hover: `color-mix(in srgb, ${v("color-primary")} 6%, transparent)`,
      selected: `color-mix(in srgb, ${v("color-accent")} 10%, transparent)`,
      focus: `color-mix(in srgb, ${v("color-accent")} 14%, transparent)`,
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    h1: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.05 },
    h2: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.08 },
    h3: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.15 },
    h4: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.2 },
    h5: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.25 },
    h6: { fontFamily: "var(--font-display), Georgia, serif", fontWeight: 500, lineHeight: 1.3 },
    button: { textTransform: "none", fontWeight: 500 },
    overline: { fontFamily: "var(--font-mono), ui-monospace, monospace", letterSpacing: "0.2em" },
  },
  components: {
    // Route every MUI `href` through Next Link, so server components can render
    // <Button href> / <Chip href> / <Link href> without passing a component prop
    // (functions can't cross the server→client boundary).
    MuiButtonBase: {
      defaultProps: { LinkComponent: NextLink },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: v("background"), color: v("foreground") },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
        sizeLarge: { paddingBlock: 12, paddingInline: 24 },
        outlined: { borderColor: v("color-border") },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 16 },
        outlined: { borderColor: v("color-border") },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: v("background"),
          "& .MuiOutlinedInput-notchedOutline": { borderColor: v("color-border") },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: v("color-muted-foreground") },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: v("color-accent"), borderWidth: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: v("color-secondary") } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginInline: 0 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: v("color-border") } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: v("color-border") },
        head: { color: v("color-muted-foreground"), fontWeight: 500 },
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover", component: NextLink },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12 } },
    },
  },
});
