/**
 * PWA Web Push Notification Types
 * Stores only anonymous push endpoint, crypto keys, followed player IDs, and chosen threshold.
 * Strictly zero personal data (no names, emails, IP addresses).
 */

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  followedPlayerIds: string[];
  threshold?: number; // default: 0.05 (±5%)
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: PushSubscriptionKeys;
  followedPlayerIds: string[];
  threshold: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  lastNotifiedAt?: string | null; // ISO string
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url: string;
    playerId?: string;
    changePercentage?: number;
  };
}

export interface DispatchResult {
  sentCount: number;
  failedCount: number;
  expiredCount: number;
  skippedRateLimitCount: number;
}
