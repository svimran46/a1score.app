(process.env as any).NODE_ENV = "test";

import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET } from "../src/app/api/health/route";

test("health endpoint: returns 200 with Cache-Control: no-store header", async () => {
  const req = new NextRequest("https://a1score.app/api/health?fotmob=false");
  const res = await GET(req);

  assert.equal(res.status, 200);
  const cacheControl = res.headers.get("Cache-Control");
  assert.ok(cacheControl, "Cache-Control header must be present");
  assert.match(cacheControl, /no-store/);

  const json = await res.json();
  assert.equal(json.checks.fotmob, "skipped");
  assert.ok(json.timestamp);
});

test("health endpoint: fotmob reachability probe runs and does NOT fail health check", async () => {
  const req = new NextRequest("https://a1score.app/api/health");
  const res = await GET(req);

  // Status must remain 200 even if FotMob is degraded or ok
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.ok(json.checks.fotmob === "ok" || json.checks.fotmob === "degraded");
  assert.ok(typeof json.fotmob.ok === "boolean");
});

test("health endpoint: respects SUPABASE_URL environment variable fallback", async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalAnon = process.env.SUPABASE_ANON_KEY;
  try {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";

    const req = new NextRequest("https://a1score.app/api/health?fotmob=false");
    const res = await GET(req);
    // Since example.supabase.co is dummy, it will be unreachable or fail, but the env was read
    const json = await res.json();
    assert.ok(json.checks.supabase === "unreachable" || json.checks.supabase === "ok");
  } finally {
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    else delete process.env.SUPABASE_URL;
    if (originalAnon) process.env.SUPABASE_ANON_KEY = originalAnon;
    else delete process.env.SUPABASE_ANON_KEY;
  }
});
