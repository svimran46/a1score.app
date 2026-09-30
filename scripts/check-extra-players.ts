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

  const names = ["Nathan Aké", "Max Alleyne", "Tijjani Reijnders", "Nico González", "Savinho", "Sverre Nypan"];
  const res = await client.query(`
    SELECT p.id, p."fullName", p."currentClubId", c.name as club_name, p.status
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."fullName" = ANY($1)
  `, [names]);
  console.log("Current DB state for extra players:", res.rows);

  await client.end();
}

main().catch(console.error);
