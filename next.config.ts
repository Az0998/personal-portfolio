import type { NextConfig } from "next";

const brokenDemoRedirects = [
  "hydro-ml",
  "desktop-pet",
  "clipboard-viz",
  "plant-ppt",
  "eco-hydro",
  "hydrology-field",
  "yaohe-review",
  "hydro-info",
] as const;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return brokenDemoRedirects.map((slug) => ({
      source: `/${slug}`,
      destination: `/presentations/${slug}`,
      permanent: false,
    }));
  },
};

export default nextConfig;
