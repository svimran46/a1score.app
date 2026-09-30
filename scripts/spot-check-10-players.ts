import "dotenv/config";
import pg from "pg";
import { fotmobFetch } from "../src/lib/fotmob/client";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

const TARGET_PLAYERS = [
  "Rodri",
  "Bernardo Silva",
  "Ibrahima Konat", // match Konaté / Konate
  "Marc Cucurella",
  "Bradley Barcola",
  "John Stones",
  "Manuel Akanji",
  "Omar Marmoush",
  "James Trafford",
  "Jack Grealish"
];

async function main() {
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("=== Spot-Checking 10 Key Players ===");

  for (const nameQuery of TARGET_PLAYERS) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Searching DB for: "${nameQuery}"`);
    const pRes = await client.query(`
      SELECT p.id, p."fullName", p."transfermarktId", p."currentClubId", c.name as club_name, p."latestMarketValue", p.status
      FROM "Player" p
      LEFT JOIN "Club" c ON p."currentClubId" = c.id
      WHERE p."fullName" ILIKE $1
    `, [`%${nameQuery}%`]);

    for (const p of pRes.rows) {
      console.log(`Found: [${p.id}] ${p.fullName} | Club: ${p.club_name} (${p.currentClubId}) | TM ID: ${p.transfermarktId} | MV: ${p.latestMarketValue} | Status: ${p.status}`);

      // Recent transfers
      const tRes = await client.query(`
        SELECT "fromClubName", "toClubName", date, "transferType", "feeEur"
        FROM "Transfer"
        WHERE "playerId" = $1
        ORDER BY date DESC
        LIMIT 3
      `, [p.id]);
      console.log(`  Latest transfers in DB:`, tRes.rows.map(t => `${t.date?.toISOString().split('T')[0]}: ${t.fromClubName} -> ${t.toClubName} (${t.transferType || 'N/A'}, €${t.feeEur})`));
    }
  }

  await client.end();
}

main().catch(console.error);
