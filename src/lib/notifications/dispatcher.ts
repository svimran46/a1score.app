/**
 * Notification Dispatcher
 *
 * Evaluates market value movements against active subscriptions and sends
 * grouped Web Push notifications with rate-limiting, idempotency, and auto-cleanup.
 * Runs on Cloudflare Workers / Edge Runtime with native WebCrypto.
 */

import { subscriptionStore } from "./store";
import {
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  DEFAULT_VAPID_SUBJECT,
} from "./vapid";
import {
  DispatchResult,
  NotificationPayload,
} from "./types";
import { formatCompactEur } from "@/lib/utils";
import { sendWebPushNotification } from "./web-push-edge";

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
  ignoreIdempotency?: boolean;
  simulatedMovements?: PlayerValuationMovement[];
  targetEndpoint?: string;
  maxSubscriptions?: number; // Cap subscriptions processed per run (default: 100)
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

  const maxSubs = options.maxSubscriptions || 100;
  const allSubscriptions = await subscriptionStore.getAll(maxSubs);
  const subscriptions = options.targetEndpoint
    ? allSubscriptions.filter((s) => s.endpoint === options.targetEndpoint)
    : allSubscriptions;

  if (subscriptions.length === 0) {
    return result;
  }

  // Index movements by player ID and slug for quick lookups
  const movementsMap = new Map<string, PlayerValuationMovement>();
  for (const m of movements) {
    movementsMap.set(m.id, m);
    if (m.slug) movementsMap.set(m.slug, m);
  }

  const expiredEndpoints: string[] = [];
  const now = new Date();

  // Process subscriptions in small concurrent batches (concurrency: 5) to respect Worker limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        // 1. Check persistent daily rate-limit (max 1 push per user per day by default)
        if (!options.ignoreRateLimit && sub.lastNotifiedAt) {
          const last = new Date(sub.lastNotifiedAt).getTime();
          if (!isNaN(last) && now.getTime() - last < ONE_DAY_MS) {
            result.skippedRateLimitCount++;
            return;
          }
        }

        // 2. Identify followed players whose value change meets/exceeds the user's threshold
        // and has not already been notified (Idempotency)
        const userThreshold = sub.threshold || 0.05;
        const triggeredPlayers: PlayerValuationMovement[] = [];
        const newlyNotifiedValues: Record<string, number> = {};

        for (const followedId of sub.followedPlayerIds) {
          const movement = movementsMap.get(followedId);
          if (movement) {
            // Check threshold condition
            if (Math.abs(movement.percentage) >= userThreshold) {
              // Idempotency check: don't notify same value twice
              const lastVal = sub.lastNotifiedValues?.[movement.id];
              if (!options.ignoreIdempotency && lastVal !== undefined && lastVal === movement.latestValueEur) {
                // Already notified for this exact valuation
                continue;
              }

              triggeredPlayers.push(movement);
              newlyNotifiedValues[movement.id] = movement.latestValueEur;
            }
          }
        }

        if (triggeredPlayers.length === 0) {
          return;
        }

        // 3. Compose grouped or single notification payload (zero PII)
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

        // 4. Send Web Push using edge WebCrypto client
        const pushResult = await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload),
          {
            vapidSubject: DEFAULT_VAPID_SUBJECT,
            vapidPublicKey: DEFAULT_VAPID_PUBLIC_KEY,
            vapidPrivateKey: DEFAULT_VAPID_PRIVATE_KEY,
          }
        );

        if (pushResult.success) {
          result.sentCount++;
          // Persist both lastNotifiedAt timestamp AND lastNotifiedValues for idempotency
          await subscriptionStore.updateLastNotified(
            sub.endpoint,
            now.toISOString(),
            newlyNotifiedValues
          );
        } else if (pushResult.expired) {
          result.expiredCount++;
          expiredEndpoints.push(sub.endpoint);
        } else {
          result.failedCount++;
          console.warn("[Push Dispatch] Push delivery failed for subscriber:", pushResult.error);
        }
      })
    );
  }

  // 5. Clean up expired subscriptions from KV / storage
  if (expiredEndpoints.length > 0) {
    await subscriptionStore.removeExpired(expiredEndpoints);
  }

  // 6. Anonymous operational logging (zero PII)
  console.log(
    `[Push Dispatch] Sent: ${result.sentCount} | Failed: ${result.failedCount} | Expired: ${result.expiredCount} | Rate-limited: ${result.skippedRateLimitCount}`
  );

  return result;
}
