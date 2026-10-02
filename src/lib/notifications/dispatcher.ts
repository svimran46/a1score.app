/**
 * Notification Dispatcher
 * Evaluates market value movements against active subscriptions and sends
 * grouped Web Push notifications with rate-limiting and auto-cleanup.
 */

import webpush from "web-push";
import { subscriptionStore } from "./store";
import {
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  DEFAULT_VAPID_SUBJECT,
} from "./vapid";
import {
  DispatchResult,
  NotificationPayload,
  PushSubscriptionRecord,
} from "./types";
import { formatCompactEur } from "@/lib/utils";

// Initialize VAPID details
try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.warn("[Push] VAPID initialization warning:", e);
}

export interface PlayerValuationMovement {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  previousValueEur: number;
  latestValueEur: number;
  diffEur: number;
  percentage: number; // e.g. 0.08 for +8%
}

export interface DispatchOptions {
  ignoreRateLimit?: boolean;
  simulatedMovements?: PlayerValuationMovement[];
  targetEndpoint?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function dispatchValuationAlerts(
  movements: PlayerValuationMovement[],
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  const result: DispatchResult = {
    sentCount: 0,
    failedCount: 0,
    expiredCount: 0,
    skippedRateLimitCount: 0,
  };

  const allSubscriptions = await subscriptionStore.getAll();
  const subscriptions = options.targetEndpoint
    ? allSubscriptions.filter((s) => s.endpoint === options.targetEndpoint)
    : allSubscriptions;

  if (subscriptions.length === 0) {
    return result;
  }

  // Index movements by player ID for quick lookups
  const movementsMap = new Map<string, PlayerValuationMovement>();
  for (const m of movements) {
    movementsMap.set(m.id, m);
    if (m.slug) movementsMap.set(m.slug, m);
  }

  const expiredEndpoints: string[] = [];
  const now = new Date();

  for (const sub of subscriptions) {
    // 1. Check rate-limit (max 1 push per user per day by default)
    if (!options.ignoreRateLimit && sub.lastNotifiedAt) {
      const last = new Date(sub.lastNotifiedAt).getTime();
      if (!isNaN(last) && now.getTime() - last < ONE_DAY_MS) {
        result.skippedRateLimitCount++;
        continue;
      }
    }

    // 2. Identify followed players whose value change meets/exceeds the user's threshold
    const userThreshold = sub.threshold || 0.05;
    const triggeredPlayers: PlayerValuationMovement[] = [];

    for (const followedId of sub.followedPlayerIds) {
      const movement = movementsMap.get(followedId);
      if (movement) {
        if (Math.abs(movement.percentage) >= userThreshold) {
          triggeredPlayers.push(movement);
        }
      }
    }

    if (triggeredPlayers.length === 0) {
      continue;
    }

    // 3. Compose grouped or single notification payload
    let payload: NotificationPayload;

    if (triggeredPlayers.length === 1) {
      const p = triggeredPlayers[0];
      const isUp = p.diffEur >= 0;
      const pctStr = (Math.abs(p.percentage) * 100).toFixed(1);
      const sign = isUp ? "+" : "-";
      const oldStr = formatCompactEur(p.previousValueEur);
      const newStr = formatCompactEur(p.latestValueEur);

      payload = {
        title: `Value update: ${p.name}`,
        body: `${oldStr} to ${newStr} (${sign}${pctStr}%)`,
        icon: p.avatarUrl || "/icon-192.png",
        badge: "/icon-192.png",
        tag: `value-update-${p.id}`,
        data: {
          url: p.slug ? `/players/${p.slug}` : `/players/${p.id}`,
          playerId: p.id,
          changePercentage: p.percentage,
        },
      };
    } else {
      const count = triggeredPlayers.length;
      const first = triggeredPlayers[0];
      const others = count - 1;

      payload = {
        title: `Value update: ${count} players you follow`,
        body: `${first.name} and ${others} other${others > 1 ? "s" : ""} changed in market value.`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "value-update-grouped",
        data: {
          url: "/watchlist",
        },
      };
    }

    // 4. Send Web Push
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify(payload)
      );

      result.sentCount++;
      await subscriptionStore.updateLastNotified(sub.endpoint, now.toISOString());
    } catch (err: any) {
      // 404 Not Found or 410 Gone indicates expired/unregistered subscription
      if (err.statusCode === 404 || err.statusCode === 410) {
        result.expiredCount++;
        expiredEndpoints.push(sub.endpoint);
      } else {
        result.failedCount++;
        console.warn("[Push] Failed to deliver push to subscriber:", err.statusCode || err.message);
      }
    }
  }

  // 5. Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await subscriptionStore.removeExpired(expiredEndpoints);
  }

  // 6. Anonymous logging (counts only, zero personal data)
  console.log(
    `[Push Dispatch] Sent: ${result.sentCount} | Failed: ${result.failedCount} | Expired: ${result.expiredCount} | Rate-limited: ${result.skippedRateLimitCount}`
  );

  return result;
}
