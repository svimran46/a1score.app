import { NextResponse } from "next/server";
import { getLiveFixtures } from "@/lib/api-football/fixtures";
import { identityFromHeaders, rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/fixtures/live — in-play fixtures across all leagues.
 * The Route Handler reads the shared Data Cache (25s window); client
 * polling this route does NOT hit api-sports.io on every request.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const verdict = rateLimit(identityFromHeaders(request.headers));
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: { kind: "rate_limited", retryAfterSeconds: verdict.retryAfterSeconds } },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } },
    );
  }

  const result = await getLiveFixtures();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ fixtures: result.data });
}
