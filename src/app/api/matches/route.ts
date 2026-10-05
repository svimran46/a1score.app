import { NextRequest, NextResponse } from "next/server";
import { getMatchesByDate, pureMd5 } from "@/lib/fotmob/client";
import { rateLimit, getClientIP, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/**
 * GET /api/matches
 * Returns matches for a given date (default today) grouped by league
 * Query params:
 * - date: YYYYMMDD (optional)
 * - filter: 'all' | 'live' | 'finished' | 'upcoming' (optional)
 */
export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(`matches:${ip}`, 120, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many match requests. Please slow down." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;
  const filter = searchParams.get("filter") || "all";

  try {
    const data = await getMatchesByDate(date);

    let leagues = data.leagues;

    if (filter === "live") {
      leagues = leagues
        .map((l) => ({
          ...l,
          matches: l.matches.filter((m) => m.isLive),
        }))
        .filter((l) => l.matches.length > 0);
    } else if (filter === "finished") {
      leagues = leagues
        .map((l) => ({
          ...l,
          matches: l.matches.filter((m) => m.isFinished),
        }))
        .filter((l) => l.matches.length > 0);
    } else if (filter === "upcoming") {
      leagues = leagues
        .map((l) => ({
          ...l,
          matches: l.matches.filter((m) => m.isUpcoming),
        }))
        .filter((l) => l.matches.length > 0);
    }

    const payload = {
      success: true,
      date: data.date,
      totalMatches: data.totalMatches,
      liveMatchesCount: data.liveMatchesCount,
      leagues,
    };

    const payloadStr = JSON.stringify(payload);
    const etag = `"${pureMd5(payloadStr)}"`;

    const hasLive = (data.liveMatchesCount || 0) > 0;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const isPast = data.date < todayStr;
    const cacheTtl = hasLive ? 30 : data.date === todayStr ? 60 : isPast ? 86400 : 300;
    const cacheControlHeader = isPast
      ? "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400"
      : `public, max-age=${cacheTtl}, s-maxage=${cacheTtl}, stale-while-revalidate=${cacheTtl * 2}`;

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": cacheControlHeader,
        },
      });
    }

    return new NextResponse(payloadStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": cacheControlHeader,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/matches:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

