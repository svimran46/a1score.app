import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

/**
 * Scheduled Valuation Snapshot Script
 * Task 1: Populates ValueSnapshot and ClubValueSnapshot with real observed points.
 * INVARIANT: Never fabricate or interpolate history; record only real, verified points.
 */
export async function takeValuationSnapshots() {
  console.log("===============================================================");
  console.log("             A1SCORE VALUATION SNAPSHOT ENGINE                 ");
  console.log("===============================================================\n");

  if (!connectionString) {
    console.warn("DATABASE_URL not configured. Snapshot skipped.");
    return { playersSnapshotted: 0, clubsSnapshotted: 0 };
  }

  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();

    // 1. Ensure ValueSnapshot and ClubValueSnapshot tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ValueSnapshot" (
        "id" TEXT PRIMARY KEY,
        "playerId" TEXT NOT NULL REFERENCES "Player"("id") ON DELETE CASCADE,
        "valueEur" BIGINT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "source" TEXT NOT NULL DEFAULT 'Transfermarkt',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "ValueSnapshot_playerId_date_source_key" 
        ON "ValueSnapshot"("playerId", "date", "source");
      CREATE INDEX IF NOT EXISTS "ValueSnapshot_playerId_date_idx" 
        ON "ValueSnapshot"("playerId", "date");

      CREATE TABLE IF NOT EXISTS "ClubValueSnapshot" (
        "id" TEXT PRIMARY KEY,
        "clubId" TEXT NOT NULL REFERENCES "Club"("id") ON DELETE CASCADE,
        "totalMarketValue" BIGINT NOT NULL,
        "squadSize" INTEGER,
        "date" TIMESTAMP(3) NOT NULL,
        "source" TEXT NOT NULL DEFAULT 'FotMob + Transfermarkt',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "ClubValueSnapshot_clubId_date_source_key" 
        ON "ClubValueSnapshot"("clubId", "date", "source");
      CREATE INDEX IF NOT EXISTS "ClubValueSnapshot_clubId_date_idx" 
        ON "ClubValueSnapshot"("clubId", "date");
    `);

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    // 2. Snapshot player valuations
    console.log("--> Recording real player valuation snapshots...");
    const playerResult = await client.query(`
      INSERT INTO "ValueSnapshot" ("id", "playerId", "valueEur", "date", "source", "createdAt")
      SELECT 
        'snap_' || substr(md5(random()::text), 1, 20),
        p.id,
        p."latestMarketValue",
        $1::timestamp,
        'Transfermarkt',
        NOW()
      FROM "Player" p
      WHERE p."latestMarketValue" IS NOT NULL 
        AND p."latestMarketValue" > 0
        AND NOT EXISTS (
          SELECT 1 FROM "ValueSnapshot" vs 
          WHERE vs."playerId" = p.id 
            AND vs."date" = $1::timestamp
            AND vs."source" = 'Transfermarkt'
        )
      RETURNING "id";
    `, [todayDate.toISOString()]);

    console.log(`[Snapshots] Recorded ${playerResult.rowCount} player valuation snapshots.`);

    // 3. Snapshot club squad total valuations
    console.log("--> Recording real club squad total valuation snapshots...");
    const clubResult = await client.query(`
      INSERT INTO "ClubValueSnapshot" ("id", "clubId", "totalMarketValue", "squadSize", "date", "source", "createdAt")
      SELECT 
        'csnap_' || substr(md5(random()::text), 1, 20),
        c.id,
        c."totalMarketValue",
        c."squadSize",
        $1::timestamp,
        'FotMob + Transfermarkt',
        NOW()
      FROM "Club" c
      WHERE c."totalMarketValue" IS NOT NULL 
        AND c."totalMarketValue" > 0
        AND NOT EXISTS (
          SELECT 1 FROM "ClubValueSnapshot" cvs 
          WHERE cvs."clubId" = c.id 
            AND cvs."date" = $1::timestamp
            AND cvs."source" = 'FotMob + Transfermarkt'
        )
      RETURNING "id";
    `, [todayDate.toISOString()]);

    console.log(`[Snapshots] Recorded ${clubResult.rowCount} club squad valuation snapshots.`);

    return {
      playersSnapshotted: playerResult.rowCount,
      clubsSnapshotted: clubResult.rowCount,
    };
  } catch (err: any) {
    console.warn("[Snapshot Warning] Failed to take snapshots (database might be offline):", err.message || err);
    return { playersSnapshotted: 0, clubsSnapshotted: 0 };
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) {
  takeValuationSnapshots().then(() => process.exit(0)).catch(() => process.exit(1));
}
