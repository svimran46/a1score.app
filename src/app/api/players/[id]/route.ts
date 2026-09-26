import { NextRequest, NextResponse } from "next/server";
import { getPlayerBySlugOrId } from "@/lib/data/players";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const player = await getPlayerBySlugOrId(params.id);
  if (!player) {
    return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: player });
}
