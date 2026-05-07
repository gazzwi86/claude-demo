import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@looper/shared"],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
