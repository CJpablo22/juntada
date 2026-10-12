import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client-heavy local demo; keep routing simple for now.
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
