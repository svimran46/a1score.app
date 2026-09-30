import type { Metadata } from "next";
import { headers } from "next/headers";

function resolveSiteUrl(): string {
  const envUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Configuration Error: SITE_URL or NEXT_PUBLIC_SITE_URL must be defined in environment variables. Silent fallback to production domain is disabled."
    );
  }

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/**
 * Returns the effective base URL for metadata, canonicals, and sitemaps.
 * On *.pages.dev preview hosts, dynamically resolves to the request host so
 * canonicals and OG links remain self-consistent without pointing to production.
 */
export function getEffectiveSiteUrl(): string {
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    if (host && host.includes("pages.dev")) {
      const proto = headersList.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // Outside request context (e.g. build phase / static analysis)
  }
  return SITE_URL;
}

/**
 * Ensures title format is always strictly: "Page Title | a1score.app"
 * Strips any pre-existing "| a1score.app" suffixes to prevent duplicates.
 */
export function formatTitle(title: string): string {
  const cleanTitle = title.trim().replace(/\s*\|\s*a1score\.app$/i, "").trim();
  return `${cleanTitle} | a1score.app`;
}

export interface MetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Unified metadata helper enforcing consistent titles, canonicals, og:url, and robots.
 */
export function constructMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
}: MetadataOptions): Metadata {
  const baseUrl = getEffectiveSiteUrl();
  const fullTitle = formatTitle(title);
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const canonicalUrl = `${baseUrl}${cleanPath}`;
  const ogImage = image || `${baseUrl}/og-default.png`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: "a1score.app",
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}
