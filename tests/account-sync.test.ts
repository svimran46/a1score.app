import test from "node:test";
import assert from "node:assert/strict";
import { diffFollows, fromRow, mergeFollows, toRow } from "../src/lib/sync/follows";
import { cleanSettings, resolveSettings } from "../src/lib/sync/settings";
import type { WatchlistItem } from "../src/lib/watchlist/storage";

const f = (id: string, savedAt: string, extra: Partial<WatchlistItem> = {}): WatchlistItem => ({
  id,
  type: "player",
  name: id,
  savedAt,
  ...extra,
});

test("toRow / fromRow round-trip a follow", () => {
  const item = f("p1", "2026-01-01T00:00:00.000Z", { slug: "p-1", initialValueEur: 10, clubName: "X" });
  const row = toRow(item);
  assert.equal(row.entity_id, "p1");
  assert.equal(row.saved_at, item.savedAt);
  assert.equal("id" in row.data, false);
  assert.deepEqual(fromRow(row), item);
});

test("mergeFollows keeps both sides and the earliest 'followed since'", () => {
  const local = [f("a", "2026-05-01T00:00:00Z", { initialValueEur: 50, currentValueEur: 70 }), f("b", "2026-04-01T00:00:00Z")];
  const remote = [f("a", "2026-01-01T00:00:00Z", { initialValueEur: 30, currentValueEur: 60 }), f("c", "2026-06-01T00:00:00Z")];
  const merged = mergeFollows(local, remote);
  assert.deepEqual(merged.map((m) => m.id), ["c", "b", "a"], "newest first");
  const a = merged.find((m) => m.id === "a")!;
  assert.equal(a.savedAt, "2026-01-01T00:00:00Z");
  assert.equal(a.initialValueEur, 30, "baseline from the earlier follow");
  assert.equal(a.currentValueEur, 70, "freshest value from the device");
  // Same id but different type are different follows.
  assert.equal(mergeFollows([{ ...f("x", "2026-01-01T00:00:00Z"), type: "club" }], [f("x", "2026-01-01T00:00:00Z")]).length, 2);
});

test("diffFollows finds added, changed and removed follows", () => {
  const before = [f("a", "t1"), f("b", "t1")];
  const after = [f("a", "t1", { currentValueEur: 5 }), f("c", "t2")];
  const d = diffFollows(before, after);
  assert.deepEqual(d.upserts.map((x) => x.id), ["a", "c"]);
  assert.deepEqual(d.deletes, [{ type: "player", id: "b" }]);
  assert.deepEqual(diffFollows(after, after), { upserts: [], deletes: [] });
});

test("settings: account wins, device fills gaps, invalid values are dropped", () => {
  const device = cleanSettings({ theme: "light", currency: "GBP", units: "metric", tv_country: "MY" });
  const account = cleanSettings({ theme: "dark", currency: null, units: "imperial", tv_country: "ZZ" });
  assert.equal(account.tv_country, null, "unsupported country dropped");
  assert.deepEqual(resolveSettings(device, account), { theme: "dark", currency: "GBP", units: "imperial", tv_country: "MY" });
  assert.deepEqual(resolveSettings(device, null), device);
  assert.deepEqual(cleanSettings({ theme: "neon", currency: "JPY" }), { theme: null, currency: null, units: null, tv_country: null });
});

/* ------------------------------------------------------------------ engine */

// Minimal browser globals for the engine (localStorage, events, <html>).
function installBrowser() {
  const store = new Map<string, string>();
  const target = new EventTarget();
  const classes = new Set<string>();
  const g = globalThis as any;
  g.window = Object.assign(target, {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    },
    matchMedia: () => ({ matches: true }),
  });
  g.document = {
    documentElement: {
      setAttribute: () => {},
      classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
    },
  };
  g.CustomEvent ??= class extends Event {
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      super(type);
      this.detail = init?.detail;
    }
  };
  g.fetch = async () => ({ ok: false, json: async () => ({}) }); // currency rates: unavailable
  return store;
}

// Fake Supabase: just enough of the query builder for the engine.
function fakeSupabase(tables: { user_follows: any[]; user_settings: any[] }) {
  const ops: string[] = [];
  const from = (table: "user_follows" | "user_settings") => {
    const filters: [string, unknown][] = [];
    const matches = (r: any) => filters.every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v));
    const api: any = {
      select: () => api,
      eq: (k: string, v: unknown) => (filters.push([k, v]), api),
      in: (k: string, v: unknown[]) => (filters.push([k, v]), api),
      maybeSingle: async () => ({ data: tables[table].find(matches) ?? null, error: null }),
      then: (res: any) => res({ data: tables[table].filter(matches), error: null }),
      upsert: async (rows: any) => {
        for (const row of Array.isArray(rows) ? rows : [rows]) {
          const key = table === "user_follows" ? (r: any) => r.type === row.type && r.entity_id === row.entity_id : () => true;
          tables[table] = [...tables[table].filter((r) => !key(r)), row];
          ops.push(`upsert ${table} ${row.entity_id ?? ""}`.trim());
        }
        return { error: null };
      },
      delete: () => {
        const del: any = {
          eq: (k: string, v: unknown) => (filters.push([k, v]), del),
          in: async (k: string, v: unknown[]) => {
            filters.push([k, v]);
            tables[table] = tables[table].filter((r) => !matches(r));
            ops.push(`delete ${table} ${v.join(",")}`);
            return { error: null };
          },
        };
        return del;
      },
    };
    return api;
  };
  return { client: { from } as any, ops, tables };
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

test("engine: first sign-in merges, later loads use the account, changes are pushed", async () => {
  const store = installBrowser();
  const { watchlistAdapter } = await import("../src/lib/watchlist/storage");
  const { startSync } = await import("../src/lib/sync/engine");

  // Device has one follow; the account has another.
  watchlistAdapter.replaceFavorites([f("local", "2026-02-01T00:00:00Z")]);
  const db = fakeSupabase({
    user_follows: [{ user_id: "u1", ...toRow(f("remote", "2026-03-01T00:00:00Z")) }],
    user_settings: [{ user_id: "u1", theme: "light", currency: null, units: null, tv_country: null }],
  });

  let stop = startSync(db.client, "u1");
  await tick(20);
  assert.deepEqual(watchlistAdapter.getFavorites().map((x) => x.id).sort(), ["local", "remote"]);
  assert.ok(db.ops.includes("upsert user_follows local"), "device-only follow uploaded");
  assert.equal(store.get("theme"), "light", "account theme applied");
  assert.equal(store.get("a1score_synced_user"), "u1");

  // A local unfollow is pushed (debounced).
  watchlistAdapter.removeFavorite("local", "player");
  await tick(700);
  assert.ok(db.ops.includes("delete user_follows local"));
  stop();

  // Next load on this device: the account is the truth, even if the device has extra items.
  watchlistAdapter.replaceFavorites([...watchlistAdapter.getFavorites(), f("stale", "2026-01-01T00:00:00Z")]);
  db.ops.length = 0;
  stop = startSync(db.client, "u1");
  await tick(20);
  assert.deepEqual(watchlistAdapter.getFavorites().map((x) => x.id), ["remote"]);
  assert.equal(db.ops.filter((o) => o.startsWith("upsert user_follows")).length, 0, "nothing re-uploaded");
  stop();
});
