import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alchemica",
    short_name: "Alchemica",
    description: "Chemistry & materials advisory — client portal",
    // Already-authenticated visitors are redirected straight to /portal or
    // /admin by the login page itself, so this works as a single entry
    // point for both client and admin installs.
    start_url: "/login",
    display: "standalone",
    background_color: "#0a0e16",
    theme_color: "#0a0e16",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
