import { MetadataRoute } from "next";
import { getEffectiveSiteUrl } from "@/lib/metadata";

export const runtime = "edge";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getEffectiveSiteUrl();
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
