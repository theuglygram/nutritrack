import type { NextConfig } from "next";

// Workspace packages (@nutritrack/*) ship TypeScript source; Turbopack transpiles them automatically.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Settings became Profile in the app navigation (ADR-033); keep old links working.
  async redirects() {
    return [{ source: "/settings", destination: "/profile", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
