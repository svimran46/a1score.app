import { NextRequest, NextResponse } from "next/server";
import { NEUTRAL_PLAYER_SVG } from "@/lib/neutral-avatars";

export const runtime = "edge";

function decodeBase64Url(str: string): string | null {
  try {
    // Add back padding if omitted
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return atob(base64);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { encoded: string } }
) {
  const decodedUrl = decodeBase64Url(params.encoded);

  if (!decodedUrl || (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://"))) {
    return new NextResponse(NEUTRAL_PLAYER_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const upstream = await fetch(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (upstream.ok) {
      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      const buffer = await upstream.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }
  } catch (err) {
    console.warn(`[Image Proxy] Upstream fetch error for encoded asset:`, err);
  }

  return new NextResponse(NEUTRAL_PLAYER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
