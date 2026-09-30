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

  const names = ["Manchester City", "Arsenal FC", "Real Madrid", "FC Barcelona", "Bayern Munich", "Paris Saint-Germain"];
  for (const n of names) {
    const res = await client.query(`SELECT id, name, "transfermarktId" FROM "Club" WHERE name ILIKE $1`, [`%${n.replace(' FC', '')}%`]);
    console.log(`Club search for "${n}":`, res.rows);
  }

  await client.end();
}

main().catch(console.error);
