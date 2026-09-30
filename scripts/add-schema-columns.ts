import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

async function main() {
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log("Adding squadSource to Club and status to Player...");
  await client.query(`
    ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "squadSource" TEXT DEFAULT 'FotMob + Transfermarkt';
    ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'first_team';
    CREATE INDEX IF NOT EXISTS "Player_status_idx" ON "Player"("status");
  `);

  console.log("Setting initial status based on contract/roster state...");
  // Players with no club -> departed
  await client.query(`
    UPDATE "Player"
    SET "status" = 'departed'
    WHERE "currentClubId" IS NULL;
  `);

  // Players with active club -> first_team
  await client.query(`
    UPDATE "Player"
    SET "status" = 'first_team'
    WHERE "currentClubId" IS NOT NULL;
  `);

  // Set default squadSource for clubs
  await client.query(`
    UPDATE "Club"
    SET "squadSource" = 'FotMob + Transfermarkt'
    WHERE "squadSource" IS NULL;
  `);

  const clubCheck = await client.query(`SELECT id, name, "lastSyncedAt", "squadSource" FROM "Club" LIMIT 3`);
  console.log("Club sample:", clubCheck.rows);

  const playerStatusCounts = await client.query(`
    SELECT "status", COUNT(*) FROM "Player" GROUP BY "status"
  `);
  console.log("Player status counts:", playerStatusCounts.rows);

  await client.end();
  console.log("Schema columns added successfully.");
}

main().catch(console.error);
