import { NextRequest, NextResponse } from "next/server";
import { getClubById } from "@/lib/data/clubs";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const club = await getClubById(params.id);
  if (!club) {
    return NextResponse.json({ success: false, error: "Club not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: club });
}
