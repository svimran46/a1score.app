import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

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
