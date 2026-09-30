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

  const res = await client.query(`SELECT id, "fullName", "currentClubId", status, "transfermarktId" FROM "Player" WHERE "fullName" ILIKE '%cancel%' OR "transfermarktId" = '182712'`);
  console.log("Cancelo search results:", res.rows);

  await client.end();
}

main().catch(console.error);
