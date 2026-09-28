import { NextRequest, NextResponse } from "next/server";
import { getMatchesByDate } from "@/lib/fotmob/client";

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

    return NextResponse.json(
      {
        success: true,
        date: data.date,
        totalMatches: data.totalMatches,
        liveMatchesCount: data.liveMatchesCount,
        leagues,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
        },
      }
    );
  } catch (err: any) {
    console.error("Error in /api/matches:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
