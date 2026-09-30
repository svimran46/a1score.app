import "dotenv/config";
import pg from "pg";
import { fotmobFetch } from "../src/lib/fotmob/client";

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

  console.log("=== Checking Gregoritsch & Rushworth ===");
  const pRes = await client.query(`
    SELECT p.id, p."fullName", p."currentClubId", c.name as club_name
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."fullName" ILIKE '%gregoritsch%' OR p."fullName" ILIKE '%rushworth%'
  `);
  console.log("Players found:", pRes.rows);

  for (const p of pRes.rows) {
    const tRes = await client.query(`
      SELECT "fromClubName", "toClubName", date, "transferType", "feeEur"
      FROM "Transfer"
      WHERE "playerId" = $1
      ORDER BY date DESC
      LIMIT 5
    `, [p.id]);
    console.log(`Transfers for ${p.fullName} (currentClub: ${p.club_name}):`, tRes.rows);
  }

  await client.end();
}

main().catch(console.error);
