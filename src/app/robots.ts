import { MetadataRoute } from "next";

export const runtime = "edge";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a1score.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/search", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
