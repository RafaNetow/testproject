import type { MetadataRoute } from "next";

const BASE_URL = "https://alchemica.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/login", "/invoices", "/auth"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
