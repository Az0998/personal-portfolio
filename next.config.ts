import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      { source: "/novel-studio", destination: "/novel-studio" },
    ];
  },
};

export default nextConfig;
