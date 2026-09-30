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

  const res = await client.query(`SELECT id, name, "transfermarktId" FROM "Club" WHERE id = 'cmuihpzls003ph29em78a0y7v'`);
  console.log(`Club for cmuihpzls003ph29em78a0y7v:`, res.rows);

  await client.end();
}

main().catch(console.error);
