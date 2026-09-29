import { NextRequest, NextResponse } from "next/server";
import { getMatchDetails, pureMd5 } from "@/lib/fotmob/client";

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

    const payload = {
      success: true,
      data,
    };

    const payloadStr = JSON.stringify(payload);
    const etag = `"${pureMd5(payloadStr)}"`;

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      });
    }

    return new NextResponse(payloadStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
      },
    });
  } catch (err: any) {
    console.error(`Error in /api/matches/${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch match details" },
      { status: 500 }
    );
  }
}

