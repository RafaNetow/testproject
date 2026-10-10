import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating "N" dev-tools button (route info). Compile and runtime
  // errors still show their overlay in development.
  devIndicators: false,
  experimental: {
    serverActions: {
      // Default is 1MB, which a real PDF or spec sheet blows past easily.
      // Kept under Vercel's own ~4.5MB serverless request body ceiling.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
