import { NextResponse } from "next/server";
import { getUsageSnapshot, REVALIDATE } from "@/lib/api-football/client";
import { isCdnMode, resolveBaseUrl, resolveMediaBase } from "@/lib/api-football/cdn";

/**
 * GET /api/status — internal quota/usage introspection (Section 2, point 5).
 * Not linked from the public UI; handy for sanity-checking daily call
 * volume against the API plan without digging through api-sports.io.
 */
export async function GET(): Promise<NextResponse> {
  const usage = getUsageSnapshot();
  return NextResponse.json({
    dailyCallCount: usage.count,
    lastCallAt: usage.lastCallAt,
    upstreamOk: usage.upstreamOk,
    trackedErrors: usage.trackedErrors,
    revalidateWindows: REVALIDATE,
    cdn: {
      enabled: isCdnMode(),
      dataBaseUrl: resolveBaseUrl(),
      mediaBaseUrl: resolveMediaBase(),
      edgeCacheHits: usage.cdnHits,
      edgeCacheMisses: usage.cdnMisses,
    },
  });
}
