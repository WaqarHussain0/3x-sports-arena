import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is intentionally disabled: route handlers use
  // `export const dynamic = 'force-dynamic'`, which Cache Components does not support.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactStrictMode: false,

  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
