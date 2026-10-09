import type { ReactNode } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { MolecularAccent } from "@/components/molecular-accent";

/**
 * The slim, dark, molecular-network-branded header used across every
 * top-level admin/portal page — the same visual language as DashboardHero,
 * just shorter, since a full-height greeting banner on every single work
 * page (Board, Files, Invoices…) would be more motion than a data-dense
 * screen should carry.
 */
export function SectionHeader({
  eyebrow,
  title,
  titleExtra,
  subtitle,
  actions,
  backLink,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Rendered inline next to the title — e.g. a status pill. */
  titleExtra?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backLink?: { href: string; label: string };
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        bgcolor: "#0a0e16",
        px: { xs: 3, sm: 4 },
        py: 3,
      }}
    >
      <MolecularAccent tone="bright" particleCount={20} desktopOnly={false} opacity={0.4} />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <div>
          {backLink && (
            <MuiLink
             
              href={backLink.href}
              underline="none"
              sx={{
                mb: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                "&:hover": { color: "#fff" },
              }}
            >
              <ArrowBack sx={{ fontSize: 16 }} />
              {backLink.label}
            </MuiLink>
          )}
          {eyebrow && (
            <Typography
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#7dd3fc",
              }}
            >
              {eyebrow}
            </Typography>
          )}
          <Box sx={{ mt: eyebrow ? 1 : 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h1" sx={{ fontSize: 24, color: "#fff" }}>
              {title}
            </Typography>
            {titleExtra}
          </Box>
          {subtitle && (
            <Typography sx={{ mt: 0.75, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{subtitle}</Typography>
          )}
        </div>
        {actions && <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
