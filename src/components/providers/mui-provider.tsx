"use client";

import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/theme/theme";

/**
 * Emotion cache for the App Router (collects styles during server rendering)
 * plus the Alchemica theme. `enableCssLayer` puts MUI's styles in an `mui`
 * cascade layer, so the layer order declared in globals.css decides what wins.
 */
export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
