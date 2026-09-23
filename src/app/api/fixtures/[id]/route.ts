import { NextResponse } from "next/server";
import { getFixtureById } from "@/lib/api-football/fixtures";
import { identityFromHeaders, rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/fixtures/:id — one fixture with score/status, for live polling
 * of a match header.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const verdict = rateLimit(identityFromHeaders(_request.headers));
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: { kind: "rate_limited", retryAfterSeconds: verdict.retryAfterSeconds } },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } },
    );
  }

  const { id } = await params;
  const fixtureId = Number.parseInt(id, 10);
  if (!Number.isInteger(fixtureId)) {
    return NextResponse.json({ error: { kind: "http", status: 400 } }, { status: 400 });
  }

  const result = await getFixtureById(fixtureId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ fixture: result.data });
}
