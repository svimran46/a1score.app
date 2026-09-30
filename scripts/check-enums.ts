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

  const posRes = await client.query(`SELECT DISTINCT "position", COUNT(*) as cnt FROM "Player" GROUP BY "position" ORDER BY cnt DESC`);
  console.log("Distinct positions in DB:", posRes.rows);

  const statusRes = await client.query(`SELECT DISTINCT "status", COUNT(*) as cnt FROM "Player" GROUP BY "status" ORDER BY cnt DESC`);
  console.log("Distinct status in DB:", statusRes.rows);

  await client.end();
}

main().catch(console.error);
