import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health/checks";

export const runtime = "edge";

/**
 * Protected Detailed Health Check Endpoint
 * Requires secret header:
 * - `x-health-secret: <SECRET>` OR
 * - `Authorization: Bearer <SECRET>`
 *
 * Returns component latencies, last successful fetch times, and schema-drift flags.
 */
export async function GET(req: NextRequest) {
  const configuredSecret =
    process.env.HEALTH_SECRET || process.env.CRON_SECRET || "a1score-dev-health-secret";

  const headerSecret = req.headers.get("x-health-secret");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const providedSecret = headerSecret || bearerToken;

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing health monitor secret header" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  const detailedHealth = await getSystemHealth(true);
  const httpStatus = detailedHealth.status === "down" ? 503 : 200;

  return NextResponse.json(detailedHealth, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
