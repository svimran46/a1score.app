import type { NextConfig } from "next";

/**
 * Media hosts allowed as remote image sources: API-Football's default
 * media CDN plus any BunnyCDN-style custom media hostname configured via
 * API_FOOTBALL_CDN_MEDIA_URL (build-time env), so logos/photos can flow
 * through the user's own CDN per API-Football's BunnyCDN guide.
 */
function imageHosts(): string[] {
  const hosts = new Set<string>(["media.api-sports.io"]);
  const custom = process.env.API_FOOTBALL_CDN_MEDIA_URL;
  if (custom) {
    try {
      const u = new URL(/^https?:\/\//i.test(custom) ? custom : `https://${custom}`);
      if (u.protocol === "https:" && u.hostname) {
        // BunnyCDN zone hostnames share the b-cdn.net suffix; a wildcard
        // keeps the media CDN working without a rebuild per zone change.
        if (u.hostname.endsWith(".b-cdn.net")) hosts.add("**.b-cdn.net");
        else hosts.add(u.hostname);
      }
    } catch {
      // ignore malformed values; the allow-list just stays minimal
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageHosts().map((hostname) => ({
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
