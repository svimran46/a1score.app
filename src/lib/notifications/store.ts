/**
 * Subscription Store for PWA Push Notifications
 * Backed by Cloudflare KV (PUSH_SUBSCRIPTIONS_KV) with clear error handling.
 * Strictly anonymous: stores endpoint, public keys, followed IDs, threshold,
 * last notified timestamp, and last notified values (for idempotency).
 *
 * In production, silent in-memory fallback is disabled.
 * If PUSH_SUBSCRIPTIONS_KV is not bound, save() fails and /api/notifications/subscribe returns 503.
 */

import { PushSubscriptionRecord } from "./types";

export interface SubscriptionStore {
  save(record: PushSubscriptionRecord): Promise<void>;
  get(endpoint: string): Promise<PushSubscriptionRecord | null>;
  delete(endpoint: string): Promise<boolean>;
  getAll(limit?: number): Promise<PushSubscriptionRecord[]>;
  updateLastNotified(
    endpoint: string,
    timestamp: string,
    notifiedValues?: Record<string, number>
  ): Promise<void>;
  removeExpired(endpoints: string[]): Promise<void>;
  hasPersistentStore(): boolean;
  clearMemoryStoreForTesting(): void;
  setForceMissingStoreForTesting(force: boolean): void;
}

// In-memory store for local testing/dev only
const inMemoryStore = new Map<string, PushSubscriptionRecord>();
let forceMissingStoreForTesting = false;

class ResilientSubscriptionStore implements SubscriptionStore {
  private getKv(): any {
    if (forceMissingStoreForTesting) {
      return null;
    }

    if (typeof globalThis !== "undefined" && (globalThis as any).PUSH_SUBSCRIPTIONS_KV) {
      return (globalThis as any).PUSH_SUBSCRIPTIONS_KV;
    }
    if (typeof process !== "undefined" && (process.env as any)?.PUSH_SUBSCRIPTIONS_KV) {
      return (process.env as any).PUSH_SUBSCRIPTIONS_KV;
    }
    return null;
  }

  hasPersistentStore(): boolean {
    if (forceMissingStoreForTesting) return false;
    const kv = this.getKv();
    return !!(kv && typeof kv.get === "function" && typeof kv.put === "function");
  }

  setForceMissingStoreForTesting(force: boolean) {
    forceMissingStoreForTesting = force;
  }

  clearMemoryStoreForTesting() {
    inMemoryStore.clear();
  }

  async save(record: PushSubscriptionRecord): Promise<void> {
    const isProd = process.env.NODE_ENV === "production";
    const kv = this.getKv();
    const hasKv = !!(kv && typeof kv.put === "function");

    if (!hasKv) {
      if (isProd || forceMissingStoreForTesting) {
        console.error(
          "[SubscriptionStore] CRITICAL: PUSH_SUBSCRIPTIONS_KV binding is missing in production. Refusing silent in-memory fallback."
        );
        throw new Error(
          "Persistent push notification store is not bound (missing PUSH_SUBSCRIPTIONS_KV)"
        );
      } else {
        // Dev / local test fallback with clear warning
        console.warn(
          "[SubscriptionStore] PUSH_SUBSCRIPTIONS_KV binding not found. Using ephemeral memory store for local development."
        );
        inMemoryStore.set(record.endpoint, record);
        return;
      }
    }

    try {
      await kv.put(`sub:${record.endpoint}`, JSON.stringify(record));
      inMemoryStore.set(record.endpoint, record);
    } catch (err: any) {
      console.error("[SubscriptionStore] Failed to write subscription to Cloudflare KV:", err);
      throw err;
    }
  }

  async get(endpoint: string): Promise<PushSubscriptionRecord | null> {
    if (inMemoryStore.has(endpoint)) {
      return inMemoryStore.get(endpoint)!;
    }

    const kv = this.getKv();
    if (kv && typeof kv.get === "function") {
      try {
        const raw = await kv.get(`sub:${endpoint}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          inMemoryStore.set(endpoint, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn("[SubscriptionStore] KV get failed:", err);
      }
    }

    return null;
  }

  async delete(endpoint: string): Promise<boolean> {
    const existed = inMemoryStore.delete(endpoint);

    const kv = this.getKv();
    if (kv && typeof kv.delete === "function") {
      try {
        await kv.delete(`sub:${endpoint}`);
      } catch (err) {
        console.warn("[SubscriptionStore] KV delete failed:", err);
      }
    }

    return existed;
  }

  async getAll(limit = 100): Promise<PushSubscriptionRecord[]> {
    const kv = this.getKv();
    if (kv && typeof kv.list === "function") {
      try {
        const list = await kv.list({ prefix: "sub:", limit });
        const records: PushSubscriptionRecord[] = [];
        for (const key of list.keys) {
          const raw = await kv.get(key.name);
          if (raw) {
            const parsed = JSON.parse(raw) as PushSubscriptionRecord;
            inMemoryStore.set(parsed.endpoint, parsed);
            records.push(parsed);
          }
        }
        return records;
      } catch (err) {
        console.warn("[SubscriptionStore] KV list failed, falling back to memory store:", err);
      }
    }

    return Array.from(inMemoryStore.values()).slice(0, limit);
  }

  async updateLastNotified(
    endpoint: string,
    timestamp: string,
    notifiedValues?: Record<string, number>
  ): Promise<void> {
    const existing = await this.get(endpoint);
    if (existing) {
      existing.lastNotifiedAt = timestamp;
      existing.updatedAt = new Date().toISOString();
      if (notifiedValues) {
        existing.lastNotifiedValues = {
          ...(existing.lastNotifiedValues || {}),
          ...notifiedValues,
        };
      }
      await this.save(existing);
    }
  }

  async removeExpired(endpoints: string[]): Promise<void> {
    for (const ep of endpoints) {
      await this.delete(ep);
    }
  }
}

export const subscriptionStore: SubscriptionStore = new ResilientSubscriptionStore();
