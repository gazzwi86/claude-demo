import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@looper/shared"],
  experimental: {
    typedRoutes: true,
  },
  // Source files use ESM-style ".js" extensions on TS relative imports
  // (so Node + tsx in apps/api can resolve them). Webpack needs to know
  // that ".js" should also try ".ts" / ".tsx".
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
};

export default config;
