// Cloudflare-friendly Edge Image Loader
// Supports Cloudflare Image Resizing (/cdn-cgi/image/...) and R2 Mirror CDN paths
// Falls back seamlessly to the direct asset URL in development or unconfigured environments

export interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
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
  if (r2BaseUrl && (src.includes('transfermarkt') || src.includes('akamaized.net'))) {
    try {
      const parsed = new URL(src);
      const cleanR2Base = r2BaseUrl.replace(/\/$/, '');
      return `${cleanR2Base}${parsed.pathname}`;
    } catch {
      // In case of invalid URL string, fall back to direct src
    }
  }

  // 3. Default: Direct source URL
  return src;
}
