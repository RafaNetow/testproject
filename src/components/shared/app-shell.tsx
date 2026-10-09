"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminSearch } from "@/components/shared/admin-search";
import { MolecularAccent } from "@/components/molecular-accent";
import { NotificationBell, type NotificationItem } from "@/components/shared/notification-bell";
import { PORTAL_NAV, ADMIN_NAV } from "@/lib/nav-items";

/** The sidebar is always dark, in both colour schemes. */
export const SIDEBAR_BG = "#0a0e16";
const SIDEBAR_ACTIVE = "#7dd3fc";
const SIDEBAR_WIDTH = 256;

type AppShellProps = {
  variant: "portal" | "admin";
  brandLabel: string;
  subtitle: string;
  userEmail: string;
  notifications: NotificationItem[];
  /** Counts shown beside a nav item, keyed by its href — e.g. what's waiting on the user. */
  badges?: Record<string, number>;
  children: ReactNode;
};

/**
 * Shared sidebar + topbar chrome for both the client portal and admin
 * console — parameterized rather than forked, so the two surfaces stay
 * visually and behaviorally consistent. Nav items (which carry icon
 * component references) are looked up here rather than passed as a prop,
 * since functions can't cross the Server->Client Component boundary.
 */
export function AppShell({
  variant,
  brandLabel,
  subtitle,
  userEmail,
  notifications,
  badges,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = variant === "portal" ? PORTAL_NAV : ADMIN_NAV;

  const isActive = (href: string) =>
    href === pathname || (href !== "/portal" && href !== "/admin" && pathname.startsWith(href));

  const navList = (
    <List component="nav" aria-label="Main" sx={{ flex: 1, px: 1.5, py: 0 }}>
      {navItems.map(({ label, href, icon: ItemIcon, activeIcon: ActiveIcon }) => {
        const active = isActive(href);
        const count = badges?.[href] ?? 0;
        const Icon = active ? ActiveIcon : ItemIcon;
        return (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={active}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 1.25,
              color: "rgba(255,255,255,0.6)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" },
              "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "rgba(255,255,255,0.1)", color: SIDEBAR_ACTIVE },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              <Icon sx={{ fontSize: 19 }} />
            </ListItemIcon>
            <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 500 } } }} />
            {count > 0 && (
              <Box
                component="span"
                aria-label={`${count} waiting`}
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: "rgba(125,211,252,0.15)",
                  color: SIDEBAR_ACTIVE,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {count}
              </Box>
            )}
          </ListItemButton>
        );
      })}
    </List>
  );

  const userBlock = (
    <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", px: 3, py: 2.5 }}>
      <Typography noWrap sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
        {userEmail}
      </Typography>
      <SignOutButton tone="dark" />
    </Box>
  );

  return (
    <Box className="app-shell" sx={{ display: "flex", minHeight: "100dvh", bgcolor: "var(--color-muted)" }}>
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "flex" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          flexDirection: "column",
          bgcolor: SIDEBAR_BG,
        }}
      >
        <Box sx={{ position: "relative", height: 176, flexShrink: 0, overflow: "hidden" }}>
          <MolecularAccent tone="bright" opacity={0.7} />
          <Box sx={{ position: "absolute", right: 16, top: 16, zIndex: 1 }}>
            <NotificationBell notifications={notifications} dark />
          </Box>
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              height: "100%",
              flexDirection: "column",
              justifyContent: "flex-end",
              px: 3,
              pb: 3,
            }}
          >
            <Typography
              component={Link}
              href="/"
              sx={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#fff", textDecoration: "none" }}
            >
              {brandLabel}
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>
        {variant === "admin" && (
          <Box sx={{ p: 1.5 }}>
            <AdminSearch />
          </Box>
        )}
        {navList}
        {userBlock}
      </Box>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            display: { xs: "flex", lg: "none" },
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: SIDEBAR_BG,
            px: 3,
            py: 2,
          }}
        >
          <Typography
            component={Link}
            href="/"
            sx={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#fff", textDecoration: "none" }}
          >
            {brandLabel}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <NotificationBell notifications={notifications} dark />
            <IconButton
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              sx={{ color: "#fff", width: 44, height: 44 }}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Box>

        <Drawer
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
          sx={{ display: { lg: "none" } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH + 24, bgcolor: SIDEBAR_BG, borderRadius: 0 } } }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
            <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#fff" }}>{brandLabel}</Typography>
            <IconButton aria-label="Close menu" onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {variant === "admin" && (
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <AdminSearch />
            </Box>
          )}
          {navList}
          {userBlock}
        </Drawer>

        <Box
          component="main"
          key={pathname}
          className="app-shell-main"
          sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, sm: 4, lg: 5 } }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
