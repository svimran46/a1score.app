/**
 * CDN configuration per API-Football's official guide
 * ("Optimizing Sports Websites with BunnyCDN").
 *
 * The guide's setup: a BunnyCDN pull zone with origin
 * https://v3.football.api-sports.io, an edge rule that injects the
 * `x-apisports-key` request header, edge cache rules (Override Cache Time /
 * Override Browser Cache Time) on GET requests, and Allowed-referrers
 * locking the zone to your domains.
 *
 * This app keeps its own Next.js Data Cache in front of the CDN, so data
 * flow is: browser → our /api routes → Next Data Cache → BunnyCDN edge →
 * API-Football. The API key is only read when no CDN URL is configured
 * (direct mode); in CDN mode the edge rule injects it and our server never
 * sends it.
 */

import { env } from "./env-config";

/**
 * Default direct base URL (Section 6 of the spec). Used when no CDN URL
 * is configured.
 */
export const DEFAULT_BASE_URL = "https://v3.football.api-sports.io/";

/** Default media (logo/photo) CDN host — also allow-listed in next.config.ts. */
export const DEFAULT_MEDIA_BASE = "https://media.api-sports.io";

/**
 * True when server→API calls should flow through the BunnyCDN pull zone
 * (`API_FOOTBALL_CDN_URL` set). In this mode the API key is injected by the
 * CDN's edge rule and must NOT be sent by us.
 */
export function isCdnMode(): boolean {
  return env.cdnBaseUrl !== null;
}

/**
 * The base URL all server-side API calls should use: the BunnyCDN pull
 * zone URL when configured, otherwise the direct API host.
 */
export function resolveBaseUrl(): string {
  return env.cdnBaseUrl ?? DEFAULT_BASE_URL;
}

/**
 * The base URL logo/photo URLs point at: the media pull zone when
 * configured (e.g. media.example.b-cdn.net), otherwise API-Football's
 * default media host.
 */
export function resolveMediaBase(): string {
  return env.cdnMediaBaseUrl ?? DEFAULT_MEDIA_BASE;
}

/**
 * Rewrite a media/logo URL from API-Football's default media host to the
 * configured media CDN base. URLs already pointing at the media base are
 * returned untouched; URLs from other hosts (unexpected) are left as-is.
 */
export function rewriteMediaUrl(url: string | null): string | null {
  if (url === null) return null;
  const mediaBase = resolveMediaBase();
  if (url.startsWith(mediaBase)) return url;
  if (url.startsWith(DEFAULT_MEDIA_BASE)) {
    // DEFAULT_MEDIA_BASE has no trailing slash; mediaBase may. Join so the
    // path is preserved with exactly one slash.
    const path = url.slice(DEFAULT_MEDIA_BASE.length); // starts with "/"
    return `${mediaBase.replace(/\/+$/, "")}${path}`;
  }
  return url;
}

/**
 * Headers for an upstream GET. In CDN mode the edge rule injects the key,
 * so we send none (guide: "leave the field blank"). In direct mode the key
 * header is required by the API.
 */
export function upstreamHeaders(): Record<string, string> {
  if (isCdnMode()) return { Accept: "application/json" };
  const key = env.apiKey;
  return key ? { Accept: "application/json", "x-apisports-key": key } : { Accept: "application/json" };
}
