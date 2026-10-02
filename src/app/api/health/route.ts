import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health/checks";

export const runtime = "edge";

/**
 * Public health check endpoint:
 * Returns overall system status and component status (ok / degraded / down).
 * Contains ZERO secrets, internal tokens, or implementation details.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const skipFotmob = searchParams.get("fotmob") === "false";

  const health = await getSystemHealth(false);

  // If client explicitly requested skipping fotmob probe (e.g. fast CI ping)
  if (skipFotmob && health.checks) {
    health.checks.fotmob = "skipped";
  }

  const httpStatus = health.status === "down" ? 503 : 200;

  return NextResponse.json(health, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
