import Box from "@mui/material/Box";

/**
 * Development-only marker showing which Supabase the dev server is talking
 * to, so a local session is never mistaken for production (or vice versa).
 * Renders nothing in production builds.
 */
export function DevEnvironmentBadge() {
  if (process.env.NODE_ENV !== "development") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);

  return (
    <Box
      role="status"
      sx={{
        pointerEvents: "none",
        position: "fixed",
        bottom: 12,
        left: 12, // bottom right belongs to the chat bubble
        zIndex: 2000,
        borderRadius: 999,
        px: 1.5,
        py: 0.5,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        bgcolor: isLocal ? "#059669" : "#dc2626",
        boxShadow: 3,
      }}
    >
      {isLocal ? "Local DB" : "Production DB"}
    </Box>
  );
}
