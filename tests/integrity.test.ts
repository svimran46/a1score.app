import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { Pool } from "pg";

// In CI without secrets, do not load local .env
if (!process.env.CI) {
  dotenv.config();
}

const connectionString = (process.env.DATABASE_URL || process.env.DIRECT_URL || "").trim();
const isDbConfigured = Boolean(connectionString);

let pool: Pool | null = null;
if (isDbConfigured && connectionString) {
  pool = new Pool({
    connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ""),
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
}

test.after(async () => {
  if (pool) {
    await pool.end();
  }
});

test("Invariant 1: Zero duplicate Player.transfermarktId values", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT "transfermarktId", COUNT(*) as count, ARRAY_AGG("fullName") as names
    FROM "Player"
    WHERE "transfermarktId" IS NOT NULL
    GROUP BY "transfermarktId"
    HAVING COUNT(*) > 1;
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found duplicate Player.transfermarktId values:\n${JSON.stringify(res.rows, null, 2)}`
  );
});

test("Invariant 2: No departed players assigned to a current club (status='departed' AND currentClubId IS NOT NULL)", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT id, "fullName", "transfermarktId", status, "currentClubId"
    FROM "Player"
    WHERE status = 'departed' AND "currentClubId" IS NOT NULL;
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found departed players with currentClubId assigned:\n${JSON.stringify(res.rows, null, 2)}`
  );
});

test("Invariant 3: No active status players missing club assignment (status IN ('first_team','academy','on_loan') AND currentClubId IS NULL)", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT id, "fullName", "transfermarktId", status, "currentClubId"
    FROM "Player"
    WHERE status IN ('first_team', 'academy', 'on_loan') AND "currentClubId" IS NULL;
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found active players without currentClubId:\n${JSON.stringify(res.rows, null, 2)}`
  );
});

test("Invariant 4: Loan assignments have valid distinct parent clubs (status='on_loan' AND (parentClubId IS NULL OR parentClubId = currentClubId))", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT id, "fullName", "transfermarktId", status, "currentClubId", "parentClubId"
    FROM "Player"
    WHERE status = 'on_loan' AND ("parentClubId" IS NULL OR "parentClubId" = "currentClubId");
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found on_loan players with invalid or missing parentClubId:\n${JSON.stringify(res.rows, null, 2)}`
  );
});

test("Invariant 5: Tracked top-flight clubs active squad size within bounds (16-40 players)", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT c.id, c.name, c."transfermarktId" as club_tm_id, l."transfermarktId" as league_code, COUNT(p.id) as active_count
    FROM "Club" c
    JOIN "League" l ON c."leagueId" = l.id
    LEFT JOIN "Player" p ON p."currentClubId" = c.id AND (p.status IS NULL OR p.status != 'departed')
    WHERE l."transfermarktId" IN ('GB1', 'ES1', 'IT1', 'L1', 'FR1', 'PO1')
      AND c."squadSource" = 'Official Transfermarkt (2026/27 Season)'
    GROUP BY c.id, c.name, c."transfermarktId", l."transfermarktId"
    HAVING COUNT(p.id) < 16 OR COUNT(p.id) > 40
    ORDER BY active_count ASC;
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found tracked top-flight clubs with squad size outliers (<16 or >40):\n${JSON.stringify(res.rows, null, 2)}`
  );
});

test("Invariant 6: Stored Club squadSize and totalMarketValue agree with live player aggregates", async (t) => {
  if (!pool) {
    t.skip("DATABASE_URL is not set. Skipping read-only database integrity invariants.");
    return;
  }

  const query = `
    SELECT 
      c.id, 
      c.name, 
      c."squadSize" as stored_size, 
      COUNT(p.id)::int as live_size,
      c."totalMarketValue"::text as stored_val, 
      COALESCE(SUM(p."latestMarketValue"), 0)::text as live_val
    FROM "Club" c
    LEFT JOIN "Player" p ON p."currentClubId" = c.id AND (p.status IS NULL OR p.status != 'departed')
    GROUP BY c.id, c.name, c."squadSize", c."totalMarketValue"
    HAVING 
      (c."squadSize" IS NOT NULL AND c."squadSize" != COUNT(p.id)) OR 
      (c."totalMarketValue" IS NOT NULL AND c."totalMarketValue" != COALESCE(SUM(p."latestMarketValue"), 0))
    ORDER BY c.name ASC;
  `;
  const res = await pool.query(query);
  assert.equal(
    res.rows.length,
    0,
    `Found ${res.rows.length} clubs where stored squadSize or totalMarketValue disagrees with live aggregates:\n${JSON.stringify(res.rows, null, 2)}`
  );
});
