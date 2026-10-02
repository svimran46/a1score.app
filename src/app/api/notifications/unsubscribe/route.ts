import { NextRequest, NextResponse } from "next/server";
import { subscriptionStore } from "@/lib/notifications/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: "Endpoint string is required" },
        { status: 400 }
      );
    }

    const deleted = await subscriptionStore.delete(endpoint);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    console.error("[API Notifications] Unsubscribe error:", err);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
