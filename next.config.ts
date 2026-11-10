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
    return [
      { source: "/sfl", destination: "/sfl-lab", permanent: false },
      ...brokenDemoRedirects.map((slug) => ({
        source: `/${slug}`,
        destination: `/presentations/${slug}`,
        permanent: false,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
