import type { NextConfig } from "next";
import { createProxyMiddleware } from "http-proxy-middleware";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;