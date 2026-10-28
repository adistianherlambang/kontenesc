import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "**.ngrok-free.app",
    "*.ngrok-free.dev",
    "**.ngrok-free.dev",
    "*.ngrok.app",
    "**.ngrok.app",
    "*.ngrok.io",
    "**.ngrok.io",
    "192.168.101.70",
    "192.168.*.*",
    "10.*.*.*",
    "localhost",
  ],
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
