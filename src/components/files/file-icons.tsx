import Box from "@mui/material/Box";
import { fileType } from "@/lib/file-manager";

/**
 * Minimal's two-tone yellow folder. A fixed colour on purpose: folders read
 * as folders whatever accent is picked in Settings.
 */
export function FolderYellow({ size = 40, open = false }: { size?: number; open?: boolean }) {
  return (
    <Box component="svg" viewBox="0 0 48 48" aria-hidden sx={{ width: size, height: size, flexShrink: 0, display: "block" }}>
      {/* back, with the tab */}
      <path d="M6 10.5A3.5 3.5 0 0 1 9.5 7h9.6a3.5 3.5 0 0 1 2.6 1.15L24.6 11.4H38.5A3.5 3.5 0 0 1 42 14.9V36.5A3.5 3.5 0 0 1 38.5 40h-29A3.5 3.5 0 0 1 6 36.5Z" fill="#FFAB00" />
      {/* a sheet peeking out */}
      <rect x="10" y="15" width="28" height="18" rx="2" fill="#FFF7E0" opacity={open ? 1 : 0.85} />
      {/* front */}
      <path
        d={open ? "M5.2 21.8A3 3 0 0 1 8.1 19.4h33.6a2.6 2.6 0 0 1 2.5 3.3l-3.6 14.6A3.5 3.5 0 0 1 37.2 40H9.6a3.5 3.5 0 0 1-3.5-3.2Z" : "M6 19.5A3.5 3.5 0 0 1 9.5 16h29a3.5 3.5 0 0 1 3.5 3.5v17A3.5 3.5 0 0 1 38.5 40h-29A3.5 3.5 0 0 1 6 36.5Z"}
        fill="#FFC107"
      />
    </Box>
  );
}

/** A small file sheet with a folded corner in the type's colour and its label, like Minimal's file thumbnails. */
export function FileTypeIcon({ filename, mime, size = 40 }: { filename: string; mime: string | null; size?: number }) {
  const type = fileType(filename, mime);
  return (
    <Box
      aria-hidden
      sx={{ position: "relative", width: size, height: size, flexShrink: 0, color: type.tone.solid, display: "grid", placeItems: "center" }}
    >
      <Box component="svg" viewBox="0 0 40 40" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M9 3h15l9 9v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" fill="currentColor" opacity={0.16} />
        <path d="M24 3v6a3 3 0 0 0 3 3h6Z" fill="currentColor" opacity={0.45} />
        <rect x="6" y="20" width="24" height="11" rx="2.5" fill="currentColor" />
      </Box>
      <Box
        component="span"
        sx={{
          position: "absolute",
          left: `${(6 / 40) * 100}%`,
          width: `${(24 / 40) * 100}%`,
          top: `${(20 / 40) * 100}%`,
          height: `${(11 / 40) * 100}%`,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: Math.max(7, size * 0.19),
          fontWeight: 800,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {type.label}
      </Box>
    </Box>
  );
}
