import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NEUTRAL_CLUB_SVG } from "@/lib/neutral-avatars";

export const runtime = "edge";

const IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
};

async function tryFetch(url: string): Promise<NextResponse | null> {
  try {
    const upstream = await fetch(url, { headers: IMAGE_HEADERS });
    if (upstream.ok) {
      const contentType = upstream.headers.get("content-type") || "image/png";
      const buffer = await upstream.arrayBuffer();
      if (buffer.byteLength > 0) {
        return new NextResponse(buffer, {
          status: 200,
          headers: { "Content-Type": contentType, ...CACHE_HEADERS },
        });
      }
    }
  } catch {}
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clubId = params.id;

  try {
    const { data: club } = await supabase
      .from("Club")
      .select("logoUrl,transfermarktId")
      .or(`id.eq.${clubId},transfermarktId.eq.${clubId}`)
      .maybeSingle();

    // 1. Try the database logoUrl first
    if (club?.logoUrl) {
      const res = await tryFetch(club.logoUrl);
      if (res) return res;
    }

    // 2. Fallback: construct CDN URL from transfermarktId
    const tmId = club?.transfermarktId;
    if (tmId) {
      // Try primary CDN (Transfermarkt image server)
      const cdnUrl = `https://www.transfermarkt.co.uk/images/wappen/head/${tmId}.png`;
      const res = await tryFetch(cdnUrl);
      if (res) return res;
    }
  } catch (err) {
    console.error(`[Image Proxy] Error for club ${clubId}:`, err);
  }

  // 3. Final fallback: neutral SVG
  return new NextResponse(NEUTRAL_CLUB_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      ...CACHE_HEADERS,
    },
  });
}
