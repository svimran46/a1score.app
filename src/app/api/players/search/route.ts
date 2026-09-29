import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/data/players";
import { rateLimit, getClientIP, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(`search:${ip}`, 45, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many search requests. Please slow down." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const position = searchParams.get("position") || undefined;
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const players = await searchPlayers(q, { position, limit });
  return NextResponse.json(
    { success: true, data: players },
    { headers: rateLimitHeaders(rl) }
  );
}
