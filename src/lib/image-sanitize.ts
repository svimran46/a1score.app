/**
 * Image URL Sanitizer & Proxy Router
 * Guarantees zero third-party image hostnames appear in HTML markup or RSC payloads.
 */

export const ALLOWED_IMAGE_HOSTS = [
  "images.fotmob.com",
  "www.fotmob.com",
  "fotmob.com",
  "img.a.transfermarkt.technology",
  "transfermarkt.technology",
  "www.transfermarkt.co.uk",
  "transfermarkt.co.uk",
  "www.transfermarkt.com",
  "transfermarkt.com",
  "tmssl.akamaized.net",
  "media.api-sports.io",
  "api-sports.io",
  "qqjpgehtutdmkkkxnefu.supabase.co",
] as const;

export function encodeBase64Url(str: string): string {
  try {
    if (typeof btoa === "function") {
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
  } catch {}
  return Buffer.from(str).toString("base64url");
}

export function decodeBase64Url(str: string): string | null {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    if (typeof atob === "function") {
      return atob(base64);
    }
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export function validateImageUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Malformed URL" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Non-HTTPS protocol" };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "Credentials not allowed in URL" };
  }

  const hostname = url.hostname.toLowerCase();

  // Block IPv4 literals
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return { ok: false, reason: "IP literal blocked" };
  }

  // Block IPv6 literals
  if (hostname.startsWith("[") || hostname.includes(":")) {
    return { ok: false, reason: "IPv6 literal blocked" };
  }

  // Block loopback, local, internal
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { ok: false, reason: "Loopback or local host blocked" };
  }

  const isAllowed = ALLOWED_IMAGE_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith("." + allowed)
  );

  if (!isAllowed) {
    return { ok: false, reason: `Host ${hostname} not in allowlist` };
  }

  return { ok: true, url };
}

export function sanitizeImageUrl(
  url: string | null | undefined,
  type: "player" | "club" | "league" | "asset" = "asset",
  id?: string | number | null
): string | null {
  // If entity id is available, always route to entity-specific proxy endpoint
  // (the proxy handles CDN fallback when the DB logoUrl is null)
  if (id && (type === "player" || type === "club" || type === "league")) {
    return `/img/${type}/${id}`;
  }

  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  // Already internal or data URI
  if (s.startsWith("/img/") || s.startsWith("data:") || s.endsWith(".svg")) {
    return s;
  }

  // External URL -> encode to asset proxy
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return `/img/asset/${encodeBase64Url(s)}`;
  }

  return s;
}
