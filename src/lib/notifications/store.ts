/**
 * Subscription Store for PWA Push Notifications
 * Backed by Cloudflare KV or D1 with resilient in-memory / cache fallback.
 * Strictly anonymous: stores endpoint, public keys, followed IDs, and threshold.
 */

import { PushSubscriptionRecord } from "./types";

export interface SubscriptionStore {
  save(record: PushSubscriptionRecord): Promise<void>;
  get(endpoint: string): Promise<PushSubscriptionRecord | null>;
  delete(endpoint: string): Promise<boolean>;
  getAll(): Promise<PushSubscriptionRecord[]>;
  updateLastNotified(endpoint: string, timestamp: string): Promise<void>;
  removeExpired(endpoints: string[]): Promise<void>;
}

// Global in-memory cache to guarantee fast lookups and local dev support
const inMemoryStore = new Map<string, PushSubscriptionRecord>();

class ResilientSubscriptionStore implements SubscriptionStore {
  private getKv(): any {
    if (typeof globalThis !== "undefined" && (globalThis as any).PUSH_SUBSCRIPTIONS_KV) {
      return (globalThis as any).PUSH_SUBSCRIPTIONS_KV;
    }
    return null;
  }

  async save(record: PushSubscriptionRecord): Promise<void> {
    inMemoryStore.set(record.endpoint, record);

    const kv = this.getKv();
    if (kv && typeof kv.put === "function") {
      try {
        await kv.put(`sub:${record.endpoint}`, JSON.stringify(record));
      } catch (err) {
        console.warn("[SubscriptionStore] KV put failed, retained in memory:", err);
      }
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

  async getAll(): Promise<PushSubscriptionRecord[]> {
    const kv = this.getKv();
    if (kv && typeof kv.list === "function") {
      try {
        const list = await kv.list({ prefix: "sub:" });
        for (const key of list.keys) {
          const raw = await kv.get(key.name);
          if (raw) {
            const parsed = JSON.parse(raw) as PushSubscriptionRecord;
            inMemoryStore.set(parsed.endpoint, parsed);
          }
        }
      } catch (err) {
        console.warn("[SubscriptionStore] KV list failed, using memory store:", err);
      }
    }

    return Array.from(inMemoryStore.values());
  }

  async updateLastNotified(endpoint: string, timestamp: string): Promise<void> {
    const existing = await this.get(endpoint);
    if (existing) {
      existing.lastNotifiedAt = timestamp;
      existing.updatedAt = new Date().toISOString();
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
