import type { NextConfig } from "next";

/**
 * Only API-Football's media CDN may be used as a remote image source.
 * Do not widen this allow-list without review.
 */
const IMAGE_HOSTS = ["media.api-sports.io"] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
