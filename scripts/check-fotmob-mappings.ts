import pg from "pg";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

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

  const clubsRes = await client.query(`SELECT id, name, "transfermarktId", "leagueId" FROM "Club"`);
  const clubById = new Map<string, any>(clubsRes.rows.map(c => [c.id, c]));
  const clubByTmId = new Map<string, any>(clubsRes.rows.filter(c => c.transfermarktId).map(c => [c.transfermarktId, c]));

  console.log("=== Checking FOTMOB_TEAM_MAPPINGS for duplicate clubIds or tmIds ===");
  const seenClubIds = new Map<string, number[]>();
  const seenTmIds = new Map<string, number[]>();

  for (const [fIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fIdStr);
    if (m.clubId) {
      if (!seenClubIds.has(m.clubId)) seenClubIds.set(m.clubId, []);
      seenClubIds.get(m.clubId)!.push(fId);
    }
    if (m.tmId) {
      if (!seenTmIds.has(m.tmId)) seenTmIds.set(m.tmId, []);
      seenTmIds.get(m.tmId)!.push(fId);
    }
  }

  console.log("\nDuplicate clubId mappings in FOTMOB_TEAM_MAPPINGS:");
  for (const [cId, fIds] of seenClubIds.entries()) {
    if (fIds.length > 1) {
      const club = clubById.get(cId);
      console.log(`Club ID ${cId} (${club?.name}): mapped by FotMob IDs: ${fIds.join(", ")}`);
    }
  }

  console.log("\nDuplicate tmId mappings in FOTMOB_TEAM_MAPPINGS:");
  for (const [tmId, fIds] of seenTmIds.entries()) {
    if (fIds.length > 1) {
      const club = clubByTmId.get(tmId);
      console.log(`TM ID ${tmId} (${club?.name}): mapped by FotMob IDs: ${fIds.join(", ")}`);
    }
  }

  /*
  // Check which clubs in target leagues (tier 1) are MISSING from FOTMOB_TEAM_MAPPINGS
  */

  await client.end();
}

main().catch(console.error);
