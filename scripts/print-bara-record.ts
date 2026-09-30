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

  const res = await client.query(`
    SELECT
      id,
      "fullName",
      "commonName",
      "position",
      "subPosition",
      "dateOfBirth",
      "nationality",
      "heightCm",
      "latestMarketValue",
      "transfermarktId",
      "currentClubId",
      "status",
      "lastSeason",
      "createdAt",
      "updatedAt"
    FROM "Player"
    WHERE id = 'cmuihw4st0d7wsexpdqcqf3cq'
  `);
  console.log("=== BARA SAPOKO NDIAYE RECORD ===");
  console.log(JSON.stringify(res.rows[0], null, 2));

  await client.end();
}

main().catch(console.error);
