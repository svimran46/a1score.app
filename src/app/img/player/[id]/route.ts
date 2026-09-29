import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NEUTRAL_PLAYER_SVG } from "@/lib/neutral-avatars";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;

  try {
    const { data: player } = await supabase
      .from("Player")
      .select("photoUrl, apiFootballId")
      .or(`id.eq.${playerId},transfermarktId.eq.${playerId}`)
      .maybeSingle();

    // Prefer official sports API URL if available, else database photoUrl
    let targetUrl = player?.photoUrl;
    if (player?.apiFootballId) {
      targetUrl = `https://media.api-sports.io/football/players/${player.apiFootballId}.png`;
    }

    if (targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))) {
      try {
        const upstream = await fetch(targetUrl, {
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
      } catch (fetchErr) {
        console.warn(`[Image Proxy] Upstream fetch failed for player ${playerId}:`, fetchErr);
      }
    }
  } catch (err) {
    console.error(`[Image Proxy] Error querying player ${playerId}:`, err);
  }

  // Fallback to neutral on-brand SVG avatar
  return new NextResponse(NEUTRAL_PLAYER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
