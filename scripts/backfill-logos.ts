import pg from "pg";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function main() {
  console.log("=== Backfilling Canonical Club Logos ===");
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const clubs = await client.query(`SELECT id, name, "transfermarktId", "logoUrl" FROM "Club"`);
  console.log(`Auditing ${clubs.rows.length} clubs...`);

  // Build reverse map from tmId -> fotmobId
  const fotmobByTmId = new Map<string, number>();
  const fotmobByClubId = new Map<string, number>();
  for (const [fIdStr, mapping] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fIdStr);
    if (mapping.tmId) fotmobByTmId.set(mapping.tmId, fId);
    if (mapping.clubId) fotmobByClubId.set(mapping.clubId, fId);
  }

  let updated = 0;
  for (const c of clubs.rows) {
    let logo = c.logoUrl;
    const fotmobId = fotmobByClubId.get(c.id) || (c.transfermarktId ? fotmobByTmId.get(c.transfermarktId) : null);

    if (!logo || logo.includes("transfermarkt.co.uk")) {
      if (fotmobId) {
        logo = `https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png`;
      } else if (c.transfermarktId) {
        logo = `https://img.a.transfermarkt.technology/wappen/head/${c.transfermarktId}.png`;
      }
    }

    if (logo && logo !== c.logoUrl) {
      await client.query(`UPDATE "Club" SET "logoUrl" = $1 WHERE id = $2`, [logo, c.id]);
      updated++;
    }
  }

  console.log(`Updated logos for ${updated} clubs!`);

  const afterStats = await client.query(`
    SELECT
      COUNT(*) as total_clubs,
      COUNT("logoUrl") as with_logo,
      COUNT(*) - COUNT("logoUrl") as null_logo
    FROM "Club"
  `);
  console.log("Post-backfill stats:", afterStats.rows);

  await client.end();
}

main().catch(console.error);
