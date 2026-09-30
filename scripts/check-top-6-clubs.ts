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

  const names = ["Manchester City", "Arsenal FC", "Real Madrid", "FC Barcelona", "Bayern Munich", "Paris Saint-Germain"];
  for (const n of names) {
    const res = await client.query(`SELECT id, name, "transfermarktId" FROM "Club" WHERE name ILIKE $1`, [`%${n.replace(' FC', '')}%`]);
    console.log(`Club search for "${n}":`, res.rows);
  }

  await client.end();
}

main().catch(console.error);
