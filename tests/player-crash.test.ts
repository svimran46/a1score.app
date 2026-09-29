import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { supabase } from "../src/lib/supabase";

const PORT = 8080;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function fetchUrl(path: string, timeoutMs = 15000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body }));
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

async function ensureServerRunning(): Promise<ChildProcess | null> {
  try {
    const res = await fetchUrl("/", 2000);
    if (res.status === 200) {
      return null; // Already running
    }
  } catch {
    // Need to start
  }

  const child = spawn("cmd", ["/c", "npx", "next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    stdio: "ignore",
    detached: false,
  });

  // Wait for server to become ready
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetchUrl("/", 2000);
      if (res.status === 200) {
        return child;
      }
    } catch {
      // keep waiting
    }
  }

  throw new Error("Failed to start local Next.js server for test suite.");
}

test("Player Pages Resilience Suite - Top 100 & 50 Random Players", async (t) => {
  const serverProc = await ensureServerRunning();

  t.after(() => {
    if (serverProc) {
      serverProc.kill();
    }
  });

  // 1. Fetch Top 100 players by latestMarketValue
  const { data: topPlayers, error: topErr } = await supabase
    .from("Player")
    .select("id, fullName, transfermarktId, latestMarketValue")
    .order("latestMarketValue", { ascending: false, nullsFirst: false })
    .limit(100);

  assert.equal(topErr, null, "Should fetch top players from DB without error");
  assert.ok(topPlayers && topPlayers.length >= 100, "Should retrieve at least 100 top players");

  // 2. Fetch 50 random players (using offset / diverse records)
  const randomOffset = Math.floor(Math.random() * 500);
  const { data: randomPlayers, error: randErr } = await supabase
    .from("Player")
    .select("id, fullName, transfermarktId, latestMarketValue")
    .range(randomOffset, randomOffset + 49);

  assert.equal(randErr, null, "Should fetch random players from DB without error");
  assert.ok(randomPlayers && randomPlayers.length >= 50, "Should retrieve at least 50 random players");

  // Combine and deduplicate
  const uniquePlayers = new Map<string, any>();
  for (const p of topPlayers) uniquePlayers.set(p.id, p);
  for (const p of randomPlayers) uniquePlayers.set(p.id, p);

  console.log(`[Test] Total unique players to verify: ${uniquePlayers.size}`);

  let successCount = 0;
  const failures: { slug: string; status: number; reason: string }[] = [];

  for (const player of uniquePlayers.values()) {
    const extId = player.transfermarktId || player.id;
    const slug = `${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`;
    const path = `/players/${encodeURIComponent(slug)}`;

    try {
      const res = await fetchUrl(path, 15000);

      // Verify HTTP 200
      if (res.status !== 200) {
        failures.push({ slug, status: res.status, reason: `Status code ${res.status}` });
        continue;
      }

      // Verify no Error Boundary triggered
      if (res.body.includes("Something went wrong")) {
        failures.push({ slug, status: res.status, reason: "Error boundary rendered" });
        continue;
      }

      if (res.body.includes("Error ID:")) {
        failures.push({ slug, status: res.status, reason: "Next.js Error digest rendered" });
        continue;
      }

      successCount++;
    } catch (err: any) {
      failures.push({ slug, status: 0, reason: err.message });
    }
  }

  console.log(`[Test] Successfully loaded ${successCount}/${uniquePlayers.size} player pages with HTTP 200.`);

  if (failures.length > 0) {
    console.error(`[Test] Failed players:`, JSON.stringify(failures, null, 2));
  }

  assert.equal(failures.length, 0, `Expected 0 failures, but ${failures.length} player pages failed.`);
  assert.ok(successCount >= 150, "At least 150 unique player pages must load with HTTP 200.");
});

test("Player Pages Edge Cases - Special Characters & Accents", async () => {
  const edgeCaseSlugs = [
    "kylian-mbappe",              // Kylian Mbappé without ID
    "kylian-mbapp--342229",       // Computed slug with stripped accent (Kylian Mbappé)
    "kylian-mbappe-342229",       // Standard English slug with ID
    "ethan-mbapp--903666",        // Ethan Mbappé
    "d-sir-dou--914562",          // Accents stripped creating double-dashes (Désiré Doué)
    "kak--3366",                  // Accent on last letter (Kaká)
    "zlatan-ibrahimovi--3455",    // Slavic accent (Zlatan Ibrahimović)
    "lamine-yamal-937958",        // Leading young talent
    "erling-haaland-82604",       // High-profile player
    "vinicius-junior",            // Vinícius Júnior without ID
  ];

  for (const slug of edgeCaseSlugs) {
    const path = `/players/${encodeURIComponent(slug)}`;
    const res = await fetchUrl(path, 15000);

    assert.equal(res.status, 200, `Slug ${slug} should return 200 OK`);
    assert.equal(res.body.includes("Something went wrong"), false, `Slug ${slug} must not trigger error boundary`);
    assert.equal(res.body.includes("Error ID:"), false, `Slug ${slug} must not display error ID`);
  }
});
