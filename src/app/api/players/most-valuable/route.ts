import { NextRequest, NextResponse } from "next/server";
import { getMostValuablePlayers } from "@/lib/data/players";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/**
 * GET /api/players/most-valuable
 * Global ranking of most valuable players by latest market value.
 * Mirrors Transfermarkt "Most valuable players in the world" page.
 *
 * Query params:
 * - limit: number (1-100, default 25)
 * - page: number (1+, default 1) for pagination
 * - position: string (optional, e.g. "Attack", "Midfield", "Defender", "Goalkeeper") - filters via ilike
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawLimit = parseInt(searchParams.get("limit") || "25", 10);
  const limit = Number.isNaN(rawLimit) ? 25 : Math.min(Math.max(rawLimit, 1), 100);

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(rawPage) ? 1 : Math.max(rawPage, 1);

  const position = searchParams.get("position") || undefined;

  // Fetch enough to support pagination + filtering. Current data layer fetches 50
  // and sorts in memory — we over-fetch to allow page 1..4 with filtering.
  // If position filter is active, fetch larger pool then filter.
  // getMostValuablePlayers pools limit*4 (capped 250) and ranks by latest value in memory.
  // We fetch enough to cover the requested page window.
  const needed = limit * page;
  // Add buffer for position filtering which shrinks the pool
  const buffer = position ? Math.min(needed * 2, 200) : needed;
  const effectiveFetch = Math.min(Math.max(buffer, 50), 200);

  let players = await getMostValuablePlayers(effectiveFetch);

  // Optional position filter (case-insensitive substring)
  if (position) {
    const needle = position.toLowerCase();
    players = players.filter((p: any) =>
      p.position?.toLowerCase().includes(needle) ||
      p.subPosition?.toLowerCase().includes(needle)
    );
  }

  const total = players.length;
  const start = (page - 1) * limit;
  const paginated = players.slice(start, start + limit);

  return NextResponse.json(
    {
      success: true,
      data: paginated,
      meta: {
        limit,
        page,
        count: paginated.length,
        total,
        hasNextPage: start + limit < total,
        hasPrevPage: page > 1,
      },
    },
    {
      headers: {
        // Cache at edge 1h, stale 1h — valuations update twice per season, not real-time
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
      },
    }
  );
}
