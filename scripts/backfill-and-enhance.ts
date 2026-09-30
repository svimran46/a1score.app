import fs from "fs";
import { parse } from "csv-parse/sync";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pg;

const LEAGUE_NAMES: Record<string, { name: string; country: string; tier: number }> = {
  GB1: { name: "Premier League", country: "England", tier: 1 },
  ES1: { name: "LaLiga", country: "Spain", tier: 1 },
  IT1: { name: "Serie A", country: "Italy", tier: 1 },
  L1: { name: "Bundesliga", country: "Germany", tier: 1 },
  FR1: { name: "Ligue 1", country: "France", tier: 1 },
  NL1: { name: "Eredivisie", country: "Netherlands", tier: 1 },
  PO1: { name: "Liga Portugal", country: "Portugal", tier: 1 },
  CL: { name: "UEFA Champions League", country: "Europe", tier: 1 },
};

async function run() {
  console.log("=== Starting Database Enhancement & Backfill ===");
  const connStr = (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]+/, "");
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected to PostgreSQL!");

  // Step 1: Add columns if they do not exist
  console.log("\n1. Ensuring columns and indexes exist...");
  await client.query(`
    ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "latestMarketValue" BIGINT;
    ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "lastSeason" INT;
    CREATE INDEX IF NOT EXISTS "Player_latestMarketValue_idx" ON "Player"("latestMarketValue" DESC NULLS LAST);
    CREATE INDEX IF NOT EXISTS "Player_lastSeason_idx" ON "Player"("lastSeason" DESC NULLS LAST);

    ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "totalMarketValue" BIGINT DEFAULT 0;
    ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "squadSize" INT DEFAULT 0;
    CREATE INDEX IF NOT EXISTS "Club_totalMarketValue_idx" ON "Club"("totalMarketValue" DESC NULLS LAST);

    ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "totalMarketValue" BIGINT DEFAULT 0;
    ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "totalPlayers" INT DEFAULT 0;
    ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "clubCount" INT DEFAULT 0;
  `);
  console.log("Columns and indexes created/verified.");

  // Step 2: Read players.csv and update Player
  console.log("\n2. Reading data/raw/players.csv and updating Player table via UNNEST...");
  const playersCsv = parse(fs.readFileSync("data/raw/players.csv", "utf-8"), { columns: true });
  console.log(`Parsed ${playersCsv.length} players from CSV.`);

  // Get all player TM IDs in DB
  const dbPlayers = await client.query('SELECT "transfermarktId" FROM "Player"');
  const dbTmIds = new Set(dbPlayers.rows.map(r => r.transfermarktId));
  console.log(`Found ${dbTmIds.size} players in DB to match.`);

  const relevantPlayers = playersCsv.filter((p: any) => dbTmIds.has(String(p.player_id)));
  console.log(`Matching ${relevantPlayers.length} players for update.`);

  const BATCH_SIZE = 2500;
  let updatedTotal = 0;
  for (let i = 0; i < relevantPlayers.length; i += BATCH_SIZE) {
    const chunk = relevantPlayers.slice(i, i + BATCH_SIZE);
    const tmIds: string[] = [];
    const values: (number | null)[] = [];
    const seasons: (number | null)[] = [];

    for (const p of chunk) {
      tmIds.push(String(p.player_id));
      values.push(p.market_value_in_eur ? parseInt(p.market_value_in_eur, 10) : null);
      seasons.push(p.last_season ? parseInt(p.last_season, 10) : null);
    }

    const res = await client.query(
      `
      UPDATE "Player" p
      SET 
        "latestMarketValue" = u.market_val,
        "lastSeason" = u.last_season
      FROM (
        SELECT * FROM UNNEST($1::text[], $2::bigint[], $3::int[]) AS t(tm_id, market_val, last_season)
      ) u
      WHERE p."transfermarktId" = u.tm_id;
      `,
      [tmIds, values, seasons]
    );

    updatedTotal += res.rowCount || 0;
    console.log(`Updated ${updatedTotal}/${relevantPlayers.length} players...`);
  }

  // Fallback: For any player whose latestMarketValue is null, check MarketValueHistory
  const fallbackRes = await client.query(`
    WITH latest_mvh AS (
      SELECT DISTINCT ON ("playerId") "playerId", "valueEur"
      FROM "MarketValueHistory"
      ORDER BY "playerId", "date" DESC
    )
    UPDATE "Player" p
    SET "latestMarketValue" = m."valueEur"
    FROM latest_mvh m
    WHERE p.id = m."playerId" AND p."latestMarketValue" IS NULL;
  `);
  console.log(`Updated ${fallbackRes.rowCount} additional players from MarketValueHistory.`);

  // Step 3: Update Club totalMarketValue and squadSize
  console.log("\n3. Calculating and updating Club squad values...");
  const clubRes = await client.query(`
    WITH club_stats AS (
      SELECT 
        "currentClubId" as club_id,
        COUNT(id) as player_count,
        COALESCE(SUM("latestMarketValue"), 0) as total_val
      FROM "Player"
      WHERE "currentClubId" IS NOT NULL
      GROUP BY "currentClubId"
    )
    UPDATE "Club" c
    SET 
      "squadSize" = s.player_count,
      "totalMarketValue" = s.total_val
    FROM club_stats s
    WHERE c.id = s.club_id;
  `);
  console.log(`Updated ${clubRes.rowCount} clubs with squad values and counts.`);

  // Step 4: Update League display names, countries, club counts, and market values
  console.log("\n4. Updating League names and aggregated stats...");
  for (const [code, info] of Object.entries(LEAGUE_NAMES)) {
    const statsRes = await client.query(`
      SELECT 
        COUNT(c.id) as club_count,
        COALESCE(SUM(c."squadSize"), 0) as player_count,
        COALESCE(SUM(c."totalMarketValue"), 0) as total_val
      FROM "Club" c
      JOIN "League" l ON c."leagueId" = l.id
      WHERE l."transfermarktId" = $1;
    `, [code]);

    const stats = statsRes.rows[0];
    const clubCount = parseInt(stats.club_count || "0", 10);
    const playerCount = parseInt(stats.player_count || "0", 10);
    const totalVal = BigInt(stats.total_val || "0");

    await client.query(`
      UPDATE "League"
      SET 
        name = $1,
        country = $2,
        tier = $3,
        "clubCount" = $4,
        "totalPlayers" = $5,
        "totalMarketValue" = $6
      WHERE "transfermarktId" = $7;
    `, [info.name, info.country, info.tier, clubCount, playerCount, totalVal, code]);
  }
  console.log("Leagues updated successfully.");

  // Step 5: Verification queries
  console.log("\n=== VERIFICATION ===");
  const topPlayers = await client.query(`
    SELECT p."fullName", p."position", p."latestMarketValue", p."lastSeason", c.name as club_name
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    ORDER BY p."latestMarketValue" DESC NULLS LAST
    LIMIT 10;
  `);
  console.log("\nTop 10 Most Valuable Players in Database:");
  console.table(topPlayers.rows.map(r => ({
    name: r.fullName,
    position: r.position,
    club: r.club_name,
    marketValue: "€" + (Number(r.latestMarketValue) / 1e6).toFixed(1) + "M",
    season: r.lastSeason
  })));

  const leaguesList = await client.query(`
    SELECT "transfermarktId", name, country, "clubCount", "totalPlayers", "totalMarketValue"
    FROM "League"
    ORDER BY "totalMarketValue" DESC;
  `);
  console.log("\nLeagues in DB:");
  console.table(leaguesList.rows.map(r => ({
    code: r.transfermarktId,
    name: r.name,
    country: r.country,
    clubs: r.clubCount,
    players: r.totalPlayers,
    totalValue: "€" + (Number(r.totalMarketValue) / 1e9).toFixed(2) + "B"
  })));

  const topClubs = await client.query(`
    SELECT c.name, l.name as league_name, c."squadSize", c."totalMarketValue"
    FROM "Club" c
    LEFT JOIN "League" l ON c."leagueId" = l.id
    ORDER BY c."totalMarketValue" DESC
    LIMIT 10;
  `);
  console.log("\nTop 10 Clubs by Squad Market Value:");
  console.table(topClubs.rows.map(r => ({
    club: r.name,
    league: r.league_name,
    squadSize: r.squadSize,
    squadValue: "€" + (Number(r.totalMarketValue) / 1e6).toFixed(1) + "M"
  })));

  await client.end();
  console.log("\n✅ Database Enhancement Completed Successfully!");
}

run().catch(console.error);
