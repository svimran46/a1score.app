import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NEUTRAL_LEAGUE_SVG } from "@/lib/neutral-avatars";
import { FOTMOB_LEAGUE_MAP } from "@/lib/fotmob/client";

export const runtime = "edge";

const IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  Referer: "https://www.fotmob.com/",
};

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
};

const LEAGUE_ALIAS_TO_FOTMOB: Record<string, number> = {
  // Transfermarkt codes
  GB1: 47,
  ES1: 87,
  IT1: 55,
  L1: 54,
  FR1: 53,
  NL1: 57,
  PO1: 61,
  CL: 42,
  // Common slugs and names
  "premier-league": 47,
  "premierleague": 47,
  "epl": 47,
  "laliga": 87,
  "la-liga": 87,
  "serie-a": 55,
  "seriea": 55,
  "bundesliga": 54,
  "ligue-1": 53,
  "ligue1": 53,
  "eredivisie": 57,
  "liga-portugal": 61,
  "ligaportugal": 61,
  "champions-league": 42,
  "uefa-champions-league": 42,
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
  const leagueId = params.id;

  try {
    // 1. Direct match by ID if numeric or alias
    const directFotmobId =
      LEAGUE_ALIAS_TO_FOTMOB[leagueId] ||
      LEAGUE_ALIAS_TO_FOTMOB[leagueId.toUpperCase()] ||
      LEAGUE_ALIAS_TO_FOTMOB[leagueId.toLowerCase()] ||
      (!isNaN(Number(leagueId)) ? Number(leagueId) : null);

    if (directFotmobId) {
      const fotmobUrl = `https://images.fotmob.com/image_resources/logo/leaguelogo/${directFotmobId}.png`;
      const res = await tryFetch(fotmobUrl);
      if (res) return res;
    }

    // 2. Fetch league from Supabase
    const { data: league } = await supabase
      .from("League")
      .select("logoUrl,transfermarktId")
      .or(`id.eq.${leagueId},transfermarktId.eq.${leagueId}`)
      .maybeSingle();

    // 3. Try FotMob CDN via transfermarktId
    const tmId = league?.transfermarktId?.toUpperCase();
    if (tmId && (FOTMOB_LEAGUE_MAP[tmId] || LEAGUE_ALIAS_TO_FOTMOB[tmId])) {
      const fotmobId = FOTMOB_LEAGUE_MAP[tmId] || LEAGUE_ALIAS_TO_FOTMOB[tmId];
      const fotmobUrl = `https://images.fotmob.com/image_resources/logo/leaguelogo/${fotmobId}.png`;
      const res = await tryFetch(fotmobUrl);
      if (res) return res;
    }

    // 4. Try database logoUrl if present
    if (league?.logoUrl) {
      const res = await tryFetch(league.logoUrl);
      if (res) return res;
    }

    // 5. Fallback: Transfermarkt CDN header
    if (tmId) {
      const cdnUrl = `https://www.transfermarkt.co.uk/images/logo/header/${tmId.toLowerCase()}.png`;
      const res = await tryFetch(cdnUrl);
      if (res) return res;
    }
  } catch (err) {
    console.error(`[Image Proxy] Error for league ${leagueId}:`, err);
  }

  // 6. Final fallback: neutral SVG
  return new NextResponse(NEUTRAL_LEAGUE_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      ...CACHE_HEADERS,
    },
  });
}
