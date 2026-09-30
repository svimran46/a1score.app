import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NEUTRAL_CLUB_SVG } from "@/lib/neutral-avatars";
import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";

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

  // 1. Instant in-memory resolution from FOTMOB_TEAM_MAPPINGS (0ms)
  let fotmobId: number | null = null;
  let tmId: string | null = null;

  // Check if clubId is numeric FotMob team ID
  if (/^\d+$/.test(clubId) && FOTMOB_TEAM_MAPPINGS[Number(clubId)]) {
    fotmobId = Number(clubId);
    tmId = FOTMOB_TEAM_MAPPINGS[Number(clubId)].tmId || null;
  } else {
    // Check by CUID or TM ID in mapping
    for (const [fIdStr, mapping] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
      if (mapping.clubId === clubId || mapping.tmId === clubId) {
        fotmobId = Number(fIdStr);
        tmId = mapping.tmId || null;
        break;
      }
    }
  }

  // If FotMob ID resolved, try high-reliability AWS Cloudfront CDN first
  if (fotmobId) {
    const fotmobRes = await tryFetch(`https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png`);
    if (fotmobRes) return fotmobRes;
  }

  // 2. Query Supabase DB for club record
  try {
    const { data: club } = await supabase
      .from("Club")
      .select("logoUrl,transfermarktId")
      .or(`id.eq.${clubId},transfermarktId.eq.${clubId}`)
      .maybeSingle();

    if (club?.logoUrl) {
      const res = await tryFetch(club.logoUrl);
      if (res) return res;
    }

    const effectiveTmId = club?.transfermarktId || tmId || (/^\d+$/.test(clubId) ? clubId : null);
    if (effectiveTmId) {
      // Try TM Technology CDN
      const cdnTechRes = await tryFetch(`https://img.a.transfermarkt.technology/wappen/head/${effectiveTmId}.png`);
      if (cdnTechRes) return cdnTechRes;

      // Try primary UK Transfermarkt
      const cdnUkRes = await tryFetch(`https://www.transfermarkt.co.uk/images/wappen/head/${effectiveTmId}.png`);
      if (cdnUkRes) return cdnUkRes;
    }
  } catch (err) {
    console.error(`[Image Proxy] Error for club ${clubId}:`, err);
  }

  // 3. Fallback: if tmId was known, try TM Technology CDN
  if (tmId) {
    const cdnTechRes = await tryFetch(`https://img.a.transfermarkt.technology/wappen/head/${tmId}.png`);
    if (cdnTechRes) return cdnTechRes;
  }

  // 4. Final fallback: neutral SVG
  return new NextResponse(NEUTRAL_CLUB_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      ...CACHE_HEADERS,
    },
  });
}
