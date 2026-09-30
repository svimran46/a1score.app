import { NextRequest, NextResponse } from "next/server";
import { NEUTRAL_PLAYER_SVG } from "@/lib/neutral-avatars";
import { decodeBase64Url, validateImageUrl } from "@/lib/image-sanitize";

export const runtime = "edge";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

function neutralResponse(): NextResponse {
  return new NextResponse(NEUTRAL_PLAYER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > maxBytes) {
          await reader.cancel("Payload exceeds maximum size");
          return null;
        }
        chunks.push(value);
      }
    }
  } catch {
    return null;
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { encoded: string } }
) {
  const decodedUrl = decodeBase64Url(params.encoded);

  if (!decodedUrl) {
    console.warn(`[Image Proxy] Failed to decode base64url parameter`);
    return neutralResponse();
  }

  let validation = validateImageUrl(decodedUrl);
  if (!validation.ok) {
    console.warn(`[Image Proxy] Validation rejected (${validation.reason}): ${decodedUrl}`);
    return neutralResponse();
  }

  let currentUrl = validation.url;

  try {
    let redirectCount = 0;
    let upstream: Response | null = null;

    while (redirectCount <= MAX_REDIRECTS) {
      upstream = await fetch(currentUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // Handle redirect status codes manually
      if (
        upstream.status === 301 ||
        upstream.status === 302 ||
        upstream.status === 303 ||
        upstream.status === 307 ||
        upstream.status === 308
      ) {
        redirectCount++;
        const location = upstream.headers.get("location");
        if (!location) {
          console.warn(`[Image Proxy] Upstream redirect missing location header from ${currentUrl.toString()}`);
          return neutralResponse();
        }

        let redirectTarget: string;
        try {
          redirectTarget = new URL(location, currentUrl.href).href;
        } catch {
          console.warn(`[Image Proxy] Invalid redirect location: ${location}`);
          return neutralResponse();
        }

        const redirectValidation = validateImageUrl(redirectTarget);
        if (!redirectValidation.ok) {
          console.warn(
            `[Image Proxy] Redirect target rejected (${redirectValidation.reason}): ${redirectTarget}`
          );
          return neutralResponse();
        }

        currentUrl = redirectValidation.url;
        continue;
      }

      break;
    }

    if (!upstream || !upstream.ok) {
      console.warn(`[Image Proxy] Upstream responded with status ${upstream?.status} for ${currentUrl.toString()}`);
      return neutralResponse();
    }

    const contentType = (upstream.headers.get("content-type") || "").toLowerCase().trim();
    // Only pass through responses whose content-type starts with image/ and is NOT image/svg+xml
    if (!contentType.startsWith("image/") || contentType.includes("image/svg+xml")) {
      console.warn(`[Image Proxy] Blocked disallowed content-type "${contentType}" from ${currentUrl.toString()}`);
      return neutralResponse();
    }

    const contentLengthHeader = upstream.headers.get("content-length");
    if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_IMAGE_BYTES) {
      console.warn(`[Image Proxy] Content-Length exceeds ${MAX_IMAGE_BYTES} bytes: ${contentLengthHeader}`);
      return neutralResponse();
    }

    const buffer = await readBodyWithLimit(upstream, MAX_IMAGE_BYTES);
    if (!buffer) {
      console.warn(`[Image Proxy] Failed to read body or body exceeded ${MAX_IMAGE_BYTES} bytes`);
      return neutralResponse();
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.warn(`[Image Proxy] Fetch error for ${currentUrl.toString()}:`, err);
    return neutralResponse();
  }
}
