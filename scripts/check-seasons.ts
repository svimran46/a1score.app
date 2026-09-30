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

  const seasonRes = await client.query(`
    SELECT "lastSeason", COUNT(*) as cnt
    FROM "Player"
    GROUP BY "lastSeason"
    ORDER BY "lastSeason" DESC NULLS LAST
  `);
  console.log("Player lastSeason counts:", seasonRes.rows);

  const transferDatesRes = await client.query(`
    SELECT
      EXTRACT(YEAR FROM date) as yr,
      COUNT(*) as cnt
    FROM "Transfer"
    GROUP BY yr
    ORDER BY yr DESC NULLS LAST
    LIMIT 10
  `);
  console.log("Transfer years:", transferDatesRes.rows);

  await client.end();
}

main().catch(console.error);
