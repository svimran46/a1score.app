import { NextRequest, NextResponse } from "next/server";
import { getMatchDetails } from "@/lib/fotmob/client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/matches/[id]
 * Returns detailed match intelligence: lineups, events, and stats
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const data = await getMatchDetails(params.id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=5",
        },
      }
    );
  } catch (err: any) {
    console.error(`Error in /api/matches/${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
