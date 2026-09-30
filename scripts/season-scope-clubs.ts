import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import fs from "fs";
import { parse } from "csv-parse/sync";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

interface ClubRow {
  club_id: string;
  name: string;
  domestic_competition_id: string;
  last_season: string;
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const isDryRun = !isApply;

  console.log("=================================================");
  console.log(`Club Season-Scoping Script (${isDryRun ? "DRY RUN MODE" : "APPLY MODE"})`);
  console.log("=================================================\n");

  // 1. Read CSV
  const csvContent = fs.readFileSync("data/clubs.csv", "utf-8");
  const records = parse(csvContent, { columns: true }) as ClubRow[];
  console.log(`Read ${records.length} club records from data/clubs.csv.`);

  // 2. Resolve DB connection host
  const connStr = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connStr) {
    console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
    process.exit(1);
  }
  const cleanUrl = connStr.replace(/[?&]sslmode=[^&]+/, "");
  const url = new URL(cleanUrl);
  const host = url.hostname;
  const ips = await new Promise<string[]>((resolve, reject) => {
    dns.resolve4(host, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });

  const client = new pg.Client({
    host: ips[0],
    port: parseInt(url.port || "5432", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: host },
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL.\n");

  try {
    // 3. Ensure column exists
    if (isApply) {
      console.log("Ensuring Club.lastSeason column and index exist...");
      await client.query(`
        ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "lastSeason" INT;
        CREATE INDEX IF NOT EXISTS "Club_lastSeason_idx" ON "Club"("lastSeason" DESC NULLS LAST);
      `);
      console.log("Column and index verified.\n");
    }

    // 4. Analyze matches
    const dbClubsRes = await client.query('SELECT id, "transfermarktId", name, "leagueId" FROM "Club"');
    console.log(`Found ${dbClubsRes.rows.length} clubs in database.`);

    const tmMap = new Map<string, number>();
    for (const r of records) {
      const season = parseInt(r.last_season, 10);
      if (!isNaN(season)) {
        tmMap.set(r.club_id, season);
      }
    }

    let matchCount = 0;
    const updates: { id: string; season: number }[] = [];
    for (const c of dbClubsRes.rows) {
      if (c.transfermarktId && tmMap.has(c.transfermarktId)) {
        matchCount++;
        updates.push({ id: c.id, season: tmMap.get(c.transfermarktId)! });
      }
    }

    console.log(`Matched ${matchCount} database clubs to CSV last_season metadata.`);

    // Check season counts for Tier 1 leagues
    const targetLeagues = ["GB1", "ES1", "IT1", "L1", "FR1"];
    console.log("\nProjected active (2025) club counts per league:");
    for (const lCode of targetLeagues) {
      const activeClubs = records.filter(
        (r) => r.domestic_competition_id === lCode && r.last_season === "2025"
      );
      console.log(`  - League ${lCode}: ${activeClubs.length} active 2025 clubs`);
    }

    if (isDryRun) {
      console.log("\n[DRY RUN] No changes were written to the database.");
      console.log("Run with '--apply' to persist lastSeason column and update League club counts.");
    } else {
      console.log("\n[APPLY] Executing batch update on Club.lastSeason...");

      // Update in batches of 100 via UNNEST
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const ids = batch.map((b) => b.id);
        const seasons = batch.map((b) => b.season);

        await client.query(
          `
          UPDATE "Club" AS c
          SET "lastSeason" = u.season
          FROM (SELECT unnest($1::text[]) AS id, unnest($2::int[]) AS season) AS u
          WHERE c.id = u.id;
        `,
          [ids, seasons]
        );
      }
      console.log(`Successfully updated ${updates.length} clubs with lastSeason.`);

      // Update League club counts based on active current season (2025)
      console.log("\nUpdating League table with true active season club counts and active market values...");
      for (const lCode of targetLeagues) {
        const activeRes = await client.query(
          `
          SELECT 
            COUNT(c.id) as active_count,
            COALESCE(SUM(c."totalMarketValue"), 0) as active_val,
            COALESCE(SUM(c."squadSize"), 0) as active_players
          FROM "Club" c
          JOIN "League" l ON c."leagueId" = l.id
          WHERE l."transfermarktId" = $1 AND c."lastSeason" = 2025;
        `,
          [lCode]
        );

        const count = parseInt(activeRes.rows[0].active_count, 10);
        const val = BigInt(activeRes.rows[0].active_val);
        const players = parseInt(activeRes.rows[0].active_players, 10);

        await client.query(
          `
          UPDATE "League"
          SET 
            "clubCount" = $1,
            "totalMarketValue" = $2,
            "totalPlayers" = $3
          WHERE "transfermarktId" = $4;
        `,
          [count, val, players, lCode]
        );
        console.log(`  Updated ${lCode}: clubCount = ${count}, players = ${players}, value = €${(Number(val) / 1e6).toFixed(1)}M`);
      }

      console.log("\n[APPLY] Database update completed successfully!");
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
