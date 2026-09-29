// Cloudflare-friendly Edge Image Loader
// Supports Cloudflare Image Resizing (/cdn-cgi/image/...) and Internal Edge Asset Proxy
// Ensures zero third-party source hostnames are exposed in HTML markup or client network requests

export interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

function encodeBase64Url(str: string): string {
  try {
    if (typeof btoa === "function") {
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
  } catch {}
  return Buffer.from(str).toString("base64url");
}

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: ImageLoaderParams): string {
  // If it's a relative URL, data URI, or already an SVG, return as-is
  if (!src || src.startsWith('/') || src.startsWith('data:') || src.endsWith('.svg')) {
    return src;
  }

  const q = quality || 75;

  // 1. Cloudflare Image Resizing (when enabled on custom domain / zone)
  const isCfResizingEnabled = process.env.NEXT_PUBLIC_CF_IMAGE_RESIZING === 'true';
  if (isCfResizingEnabled) {
    return `/cdn-cgi/image/width=${width},quality=${q},format=auto/${src}`;
  }

  // 2. Cloudflare R2 Mirror CDN (if configured via env variable)
  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL;
  if (r2BaseUrl && !src.startsWith(r2BaseUrl)) {
    try {
      const parsed = new URL(src);
      const cleanR2Base = r2BaseUrl.replace(/\/$/, '');
      return `${cleanR2Base}${parsed.pathname}`;
    } catch {
      // In case of invalid URL string, fall through to proxy
    }
  }

  // 3. For any external HTTP/HTTPS URL, proxy through our internal edge endpoint
  // to prevent exposing third-party domains in rendered HTML markup
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const encoded = encodeBase64Url(src);
    return `/img/asset/${encoded}`;
  }

  return src;
}
