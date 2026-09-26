import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/data/players";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const position = searchParams.get("position") || undefined;
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const players = await searchPlayers(q, { position, limit });
  return NextResponse.json({ success: true, data: players });
}
