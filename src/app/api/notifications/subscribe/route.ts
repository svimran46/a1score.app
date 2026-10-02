import { NextRequest, NextResponse } from "next/server";
import { subscriptionStore } from "@/lib/notifications/store";
import { PushSubscriptionRecord } from "@/lib/notifications/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, followedPlayerIds = [], threshold = 0.05 } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const existing = await subscriptionStore.get(subscription.endpoint);

    const record: PushSubscriptionRecord = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      followedPlayerIds: Array.isArray(followedPlayerIds) ? followedPlayerIds : [],
      threshold: typeof threshold === "number" ? threshold : 0.05,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      lastNotifiedAt: existing ? existing.lastNotifiedAt : null,
    };

    await subscriptionStore.save(record);

    return NextResponse.json({ success: true, record: { threshold: record.threshold } });
  } catch (err: any) {
    console.error("[API Notifications] Subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
