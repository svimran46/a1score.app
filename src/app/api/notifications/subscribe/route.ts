import { NextRequest, NextResponse } from "next/server";
import { subscriptionStore } from "@/lib/notifications/store";
import { PushSubscriptionRecord } from "@/lib/notifications/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify persistent store is configured in production
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !subscriptionStore.hasPersistentStore()) {
      console.error(
        "[API Notifications] Cannot subscribe: PUSH_SUBSCRIPTIONS_KV is not configured in production."
      );
      return NextResponse.json(
        { error: "Push notification storage is not configured (missing PUSH_SUBSCRIPTIONS_KV binding)" },
        { status: 503 }
      );
    }

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
      lastNotifiedValues: existing ? existing.lastNotifiedValues : {},
    };

    try {
      await subscriptionStore.save(record);
    } catch (saveErr: any) {
      if (saveErr?.message?.includes("missing PUSH_SUBSCRIPTIONS_KV")) {
        return NextResponse.json(
          { error: "Push notification storage is not configured (missing PUSH_SUBSCRIPTIONS_KV binding)" },
          { status: 503 }
        );
      }
      throw saveErr;
    }

    return NextResponse.json({ success: true, record: { threshold: record.threshold } });
  } catch (err: any) {
    console.error("[API Notifications] Subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
