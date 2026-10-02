import { NextRequest, NextResponse } from "next/server";
import { dispatchValuationAlerts, PlayerValuationMovement } from "@/lib/notifications/dispatcher";
import { subscriptionStore } from "@/lib/notifications/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      endpoint,
      multiple = false,
      playerId = "lamine-yamal",
      playerName = "Lamine Yamal",
      slug = "lamine-yamal-1051588",
    } = body;

    let targetEndpoint = endpoint;
    if (!targetEndpoint) {
      const all = await subscriptionStore.getAll();
      if (all.length > 0) {
        targetEndpoint = all[all.length - 1].endpoint;
      }
    }

    if (!targetEndpoint) {
      return NextResponse.json(
        { error: "No active push subscriptions found to test" },
        { status: 404 }
      );
    }

    // Ensure the target subscription is following the test player for this test
    const sub = await subscriptionStore.get(targetEndpoint);
    if (sub && !sub.followedPlayerIds.includes(playerId)) {
      sub.followedPlayerIds.push(playerId);
      if (multiple && !sub.followedPlayerIds.includes("erling-haaland")) {
        sub.followedPlayerIds.push("erling-haaland");
      }
      await subscriptionStore.save(sub);
    }

    const testMovements: PlayerValuationMovement[] = [
      {
        id: playerId,
        name: playerName,
        slug: slug,
        previousValueEur: 150000000,
        latestValueEur: 180000000,
        diffEur: 30000000,
        percentage: 0.20,
      },
    ];

    if (multiple) {
      testMovements.push({
        id: "erling-haaland",
        name: "Erling Haaland",
        slug: "erling-haaland-418560",
        previousValueEur: 180000000,
        latestValueEur: 200000000,
        diffEur: 20000000,
        percentage: 0.111,
      });
    }

    const dispatchResult = await dispatchValuationAlerts(testMovements, {
      ignoreRateLimit: true, // Allow test mode to dispatch immediately
      targetEndpoint,
    });

    return NextResponse.json({
      success: true,
      testMovementsCount: testMovements.length,
      dispatchResult,
    });
  } catch (err: any) {
    console.error("[API Notifications] Test notification error:", err);
    return NextResponse.json(
      { error: "Failed to send test push notification", details: err.message },
      { status: 500 }
    );
  }
}
