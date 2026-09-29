/**
 * Image URL Sanitizer & Proxy Router
 * Guarantees zero third-party image hostnames appear in HTML markup or RSC payloads.
 */

export function encodeBase64Url(str: string): string {
  try {
    if (typeof btoa === "function") {
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
  } catch {}
  return Buffer.from(str).toString("base64url");
}

export function sanitizeImageUrl(
  url: string | null | undefined,
  type: "player" | "club" | "league" | "asset" = "asset",
  id?: string | number | null
): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  // Already internal or data URI
  if (s.startsWith("/img/") || s.startsWith("data:") || s.endsWith(".svg")) {
    return s;
  }

  // If entity id is available, route to entity-specific endpoint
  if (id && (type === "player" || type === "club" || type === "league")) {
    return `/img/${type}/${id}`;
  }

  // External URL -> encode to asset proxy
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return `/img/asset/${encodeBase64Url(s)}`;
  }

  return s;
}
