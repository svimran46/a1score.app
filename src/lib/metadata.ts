import type { Metadata } from "next";

export const SITE_URL =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://a1score.app";

/**
 * Ensures title format is always strictly: "Page Title | a1score.app"
 * Strips any pre-existing "| a1score.app" suffixes to prevent duplicates.
 */
export function formatTitle(title: string): string {
  const cleanTitle = title.replace(/\s*\|\s*a1score\.app$/i, "").trim();
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
  const fullTitle = formatTitle(title);
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const canonicalUrl = `${SITE_URL.replace(/\/$/, "")}${cleanPath}`;
  const ogImage = image || `${SITE_URL.replace(/\/$/, "")}/og-default.png`;

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
