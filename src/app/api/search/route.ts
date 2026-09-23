import { NextResponse } from "next/server";
import { searchLeagues } from "@/lib/api-football/leagues";
import { searchTeams } from "@/lib/api-football/teams";
import { identityFromHeaders, rateLimit } from "@/lib/rate-limit";
import type { SearchResult } from "@/lib/schemas";

/**
 * GET /api/search?q= — debounced client search across teams and leagues.
 * Two cached upstream calls per unique query (shared by all visitors via
 * the Data Cache), protected by per-IP rate limiting.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const verdict = rateLimit(identityFromHeaders(request.headers));
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: { kind: "rate_limited", retryAfterSeconds: verdict.retryAfterSeconds } },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [leagues, teams] = await Promise.all([searchLeagues(q), searchTeams(q)]);

  const results: SearchResult[] = [];

  if (teams.ok) {
    for (const t of teams.data) {
      results.push({
        kind: "team",
        id: t.id,
        name: t.name,
        logoUrl: t.logoUrl,
        country: t.country,
      });
    }
  }

  if (leagues.ok) {
    for (const l of leagues.data) {
      results.push({
        kind: "league",
        id: l.id,
        name: l.name,
        logoUrl: l.logoUrl,
        country: l.countryName,
        season: l.season,
      });
    }
  }

  // Teams first (usually the intent), then leagues; dedupe defensively.
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const key = `${r.kind}:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ results: unique.slice(0, 40) });
}
