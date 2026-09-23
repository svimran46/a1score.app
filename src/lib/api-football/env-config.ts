import "server-only";

/**
 * Server-only environment configuration for the API/CDN layer. Parsed once
 * at module load; never imported from client code (`server-only` guard).
 *
 * - API_FOOTBALL_KEY       — required in direct mode, unused in CDN mode
 * - API_FOOTBALL_CDN_URL   — BunnyCDN pull zone URL (data), enables CDN mode
 * - API_FOOTBALL_CDN_MEDIA_URL — optional media pull zone for logos/photos
 */

function parseUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:") return null;
    // Guarantee a trailing slash so `new URL(path, base)` resolves paths
    // relative to the root.
    return url.toString().endsWith("/") ? url.toString() : `${url.toString()}/`;
  } catch {
    return null;
  }
}

const cdnBaseUrl = parseUrl(process.env.API_FOOTBALL_CDN_URL);
const cdnMediaBaseUrl = parseUrl(process.env.API_FOOTBALL_CDN_MEDIA_URL);
const apiKey = process.env.API_FOOTBALL_KEY?.trim() || null;

export const env = {
  apiKey,
  cdnBaseUrl,
  cdnMediaBaseUrl,
};
