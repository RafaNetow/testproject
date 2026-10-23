"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useSignOut } from "@/components/sign-out-button";
import { AdminSearch } from "@/components/shared/admin-search";
import { NotificationBell, type NotificationItem } from "@/components/shared/notification-bell";
import { SettingsDrawer } from "@/components/shared/settings-drawer";
import { SuccessToaster } from "@/components/shared/success-toast";
import { ChatDrawer } from "@/components/messages/chat-drawer";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { RouteLoaderController, RouteLoaderOverlay } from "@/components/shared/route-loader";
import { PORTAL_NAV, ADMIN_NAV } from "@/lib/nav-items";
import { Menu as MenuIcon, LogoutOutlined, HomeOutlined } from "@/components/icons";

const SIDEBAR_WIDTH = 280;
const HEADER_HEIGHT = { xs: 64, lg: 72 };

type AppShellProps = {
  variant: "portal" | "admin";
  brandLabel: string;
  subtitle: string;
  userEmail: string;
  userId: string;
  notifications: NotificationItem[];
  /** Counts shown beside a nav item, keyed by its href — e.g. what's waiting on the user. */
  badges?: Record<string, number>;
  /** Chat bubble: unread count, and the client's projects for the project picker. */
  chat?: { unread: number; projects?: { id: string; name: string }[]; aiEnabled?: boolean };
  children: ReactNode;
};

function initialsFor(email: string) {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase() || "?";
}

/**
 * Shared sidebar + header chrome for both the client portal and admin
 * console — parameterized rather than forked, so the two surfaces stay
 * visually and behaviorally consistent. Laid out like a "Minimal" MUI
 * dashboard: a light sidebar with a dashed edge, a translucent sticky header
 * with search/notifications/account, and a centered content column.
 *
 * Nav items (which carry icon component references) are looked up here
 * rather than passed as a prop, since functions can't cross the
 * Server->Client Component boundary.
 */
export function AppShell({
  variant,
  brandLabel,
  subtitle,
  userEmail,
  userId,
  notifications,
  badges,
  chat,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = variant === "portal" ? PORTAL_NAV : ADMIN_NAV;

  const isActive = (href: string) =>
    href === pathname || (href !== "/portal" && href !== "/admin" && pathname.startsWith(href));

  const brand = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 3 }}>
      <Box
        component={Link}
        href="/"
        aria-label={`${brandLabel} home`}
        sx={{ display: "grid", placeItems: "center", width: 40, height: 40, color: "primary.main", textDecoration: "none" }}
      >
        <BrandMark />
      </Box>
      <div>
        <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{brandLabel}</Typography>
        <Typography sx={{ fontSize: 12, color: "text.muted" }}>{subtitle}</Typography>
      </div>
    </Box>
  );

  const navList = (
    <List
      component="nav"
      aria-label="Main"
      sx={{ flex: 1, px: 2, py: 0 }}
      subheader={
        <ListSubheader
          disableSticky
          sx={{
            bgcolor: "transparent",
            px: 1.5,
            lineHeight: "36px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "text.muted",
          }}
        >
          {variant === "portal" ? "Workspace" : "Management"}
        </ListSubheader>
      }
    >
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
              minHeight: 44,
              borderRadius: 1,
              mb: 0.5,
              pl: 1.5,
              pr: 1,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover" },
              "&.Mui-selected, &.Mui-selected:hover": {
                bgcolor: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
                color: "primary.main",
              },
              "&.Mui-selected:hover": { bgcolor: "color-mix(in srgb, var(--color-accent) 16%, transparent)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <Icon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 500 } } }}
            />
            {count > 0 && (
              <Box
                component="span"
                aria-label={`${count} waiting`}
                sx={{
                  ml: 1,
                  minWidth: 24,
                  height: 24,
                  px: 0.75,
                  display: "inline-grid",
                  placeItems: "center",
                  borderRadius: 0.75,
                  bgcolor: "color-mix(in srgb, var(--color-destructive) 16%, transparent)",
                  color: "error.main",
                  fontSize: 12,
                  fontWeight: 700,
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

  const sidebarFooter = (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: "var(--color-muted)",
        }}
      >
        <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: "primary.main", color: "primary.contrastText" }}>
          {initialsFor(userEmail)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
            {userEmail}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.muted" }}>{variant === "admin" ? "Administrator" : "Client"}</Typography>
        </Box>
      </Box>
    </Box>
  );

  const sidebarContent = (
    <>
      {brand}
      {navList}
      {sidebarFooter}
    </>
  );

  return (
    <Box className="app-shell" sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Suspense fallback={null}>
        <NavigationProgress />
        <RouteLoaderController />
      </Suspense>
      <RouteLoaderOverlay top={HEADER_HEIGHT} left={{ xs: 0, lg: SIDEBAR_WIDTH }} />
      <SuccessToaster />
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "sticky",
          top: 0,
          height: "100dvh",
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          flexDirection: "column",
          overflowY: "auto",
          borderRight: "1px dashed var(--border-dashed)",
        }}
      >
        {sidebarContent}
      </Box>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { lg: "none" } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, borderRadius: 0, bgcolor: "background.default" } } }}
      >
        {sidebarContent}
      </Drawer>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: (t) => t.zIndex.appBar,
            display: "flex",
            alignItems: "center",
            gap: 1,
            height: HEADER_HEIGHT,
            px: { xs: 2, sm: 3, lg: 5 },
            bgcolor: "color-mix(in srgb, var(--background) 80%, transparent)",
            backdropFilter: "blur(6px)",
          }}
        >
          <IconButton
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            sx={{ display: { lg: "none" }, ml: -1 }}
          >
            <MenuIcon />
          </IconButton>

          {variant === "admin" && (
            <Box sx={{ width: { xs: "100%", sm: 320 }, maxWidth: 320 }}>
              <AdminSearch />
            </Box>
          )}

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <SettingsDrawer surface={variant} />
            <NotificationBell notifications={notifications} surface={variant} userId={userId} />
            <AccountMenu email={userEmail} variant={variant} />
          </Box>
        </Box>

        <Box
          component="main"
          key={pathname}
          className="app-shell-main"
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 2, sm: 3, lg: 5 },
            pt: { xs: 1, lg: 2 },
            // Room at the bottom so the chat bubble never covers the last thing on the page.
            pb: chat ? 13 : { xs: 6, lg: 10 },
            // Work surfaces like the kanban board opt out of the centered column.
            "&:has([data-full-bleed])": { maxWidth: "none", pb: { xs: 2, lg: 3 } },
          }}
        >
          {children}
        </Box>
      </Box>

      {chat && (
        // Floating bubble, bottom right. Kept out of the top bar: its backdrop
        // blur would trap a position:fixed child. useSearchParams (for ?chat=
        // links) needs a Suspense boundary.
        <Suspense fallback={null}>
          <ChatDrawer surface={variant} viewerId={userId} projects={chat.projects} unread={chat.unread} aiEnabled={chat.aiEnabled} />
        </Suspense>
      )}
    </Box>
  );
}

/** A benzene-ring hexagon around the initial — a quiet chemistry signature. */
function BrandMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <polygon points="20,2.5 35.2,11.25 35.2,28.75 20,37.5 4.8,28.75 4.8,11.25" fill="currentColor" />
      <polygon
        points="20,8 30.4,14 30.4,26 20,32 9.6,26 9.6,14"
        fill="none"
        stroke="var(--color-accent-foreground)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fontFamily="var(--font-dashboard), system-ui, sans-serif"
        fill="var(--color-accent-foreground)"
      >
        A
      </text>
    </svg>
  );
}

function AccountMenu({ email, variant }: { email: string; variant: "portal" | "admin" }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const signOut = useSignOut();

  return (
    <>
      <IconButton
        aria-label="Account"
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          p: "3px",
          background: "conic-gradient(from 90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 30%, white), var(--color-accent))",
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            fontSize: 13,
            border: "2px solid",
            borderColor: "background.default",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          {initialsFor(email)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
            {email}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.muted" }}>{variant === "admin" ? "Administrator" : "Client"}</Typography>
        </Box>
        <Divider sx={{ borderStyle: "dashed", my: 0.5 }} />
        <MenuItem component={Link} href={variant === "admin" ? "/admin" : "/portal"} onClick={() => setAnchor(null)}>
          <HomeOutlined sx={{ fontSize: 20, mr: 1.5, color: "text.secondary" }} />
          Home
        </MenuItem>
        <Divider sx={{ borderStyle: "dashed", my: 0.5 }} />
        <MenuItem onClick={signOut} sx={{ color: "error.main", fontWeight: 600 }}>
          <LogoutOutlined sx={{ fontSize: 20, mr: 1.5 }} />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
