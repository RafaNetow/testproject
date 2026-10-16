import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating "N" dev-tools button (route info). Compile and runtime
  // errors still show their overlay in development.
  devIndicators: false,
  // Dev only: lets a second session run on 127.0.0.1:3000 next to localhost:3000
  // (cookies are per host), e.g. the admin and a client side by side.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      // Default is 1MB, which a real PDF or spec sheet blows past easily.
      // Kept under Vercel's own ~4.5MB serverless request body ceiling.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
