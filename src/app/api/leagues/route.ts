import { NextResponse } from "next/server";
import { getLeagues } from "@/lib/data/leagues";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagues = await getLeagues();
  return NextResponse.json({ success: true, data: leagues });
}
