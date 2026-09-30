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

  const posRes = await client.query(`SELECT DISTINCT "position", COUNT(*) as cnt FROM "Player" GROUP BY "position" ORDER BY cnt DESC`);
  console.log("Distinct positions in DB:", posRes.rows);

  const statusRes = await client.query(`SELECT DISTINCT "status", COUNT(*) as cnt FROM "Player" GROUP BY "status" ORDER BY cnt DESC`);
  console.log("Distinct status in DB:", statusRes.rows);

  await client.end();
}

main().catch(console.error);
