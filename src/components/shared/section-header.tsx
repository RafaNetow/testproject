import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

/**
 * The page heading used across every admin/portal page — a plain title with a
 * breadcrumb trail beneath and actions on the right, in the "Minimal"
 * dashboard style. Data-dense work pages (Board, Files, Invoices…) get to
 * start right under it instead of below a banner.
 */
export function SectionHeader({
  eyebrow,
  title,
  titleExtra,
  subtitle,
  actions,
  backLink,
}: {
  /** Shown as the last breadcrumb — the section this page belongs to. */
  eyebrow?: string;
  title: ReactNode;
  /** Rendered inline next to the title — e.g. a status pill. */
  titleExtra?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backLink?: { href: string; label: string };
}) {
  const crumbs = [backLink, eyebrow].filter(Boolean);

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h1" sx={{ fontSize: 24, lineHeight: 1.5 }}>
            {title}
          </Typography>
          {titleExtra}
        </Box>
        {crumbs.length > 0 && (
          <Box
            component="nav"
            aria-label="Breadcrumb"
            sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, fontSize: 14 }}
          >
            {backLink && (
              <MuiLink href={backLink.href} color="text.primary" sx={{ fontWeight: 500 }}>
                {backLink.label}
              </MuiLink>
            )}
            {backLink && eyebrow && <Dot />}
            {eyebrow && (
              <Typography component="span" sx={{ fontSize: 14, color: "text.muted" }}>
                {eyebrow}
              </Typography>
            )}
            {backLink && !eyebrow && (
              <>
                <Dot />
                <Typography component="span" noWrap sx={{ fontSize: 14, color: "text.muted", maxWidth: 280 }}>
                  {title}
                </Typography>
              </>
            )}
          </Box>
        )}
        {subtitle && <Typography sx={{ mt: 1, fontSize: 14, color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>{actions}</Box>}
    </Box>
  );
}

function Dot() {
  return <Box component="span" aria-hidden sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.muted" }} />;
}
