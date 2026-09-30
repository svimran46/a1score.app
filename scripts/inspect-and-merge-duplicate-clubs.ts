import "dotenv/config";
import pg from "pg";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

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

  console.log("=== Inspecting Clubs for Duplicates & FotMob Mapping ===");

  // 1. Get all clubs
  const res = await client.query(`
    SELECT id, name, code, "transfermarktId", "leagueId", "squadSize", "totalMarketValue"
    FROM "Club"
    ORDER BY name ASC
  `);
  console.log(`Total clubs in DB: ${res.rows.length}`);

  // Build reverse mapping: tmId -> FotMob Team ID, clubId -> FotMob Team ID
  const tmToFotmob = new Map<string, number>();
  const clubIdToFotmob = new Map<string, number>();
  for (const [fIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fIdStr);
    if (m.tmId) tmToFotmob.set(m.tmId, fId);
    if (m.clubId) clubIdToFotmob.set(m.clubId, fId);
  }

  // Check each club's resolved FotMob ID
  const clubsWithFotmob = res.rows.map(c => {
    let fId = clubIdToFotmob.get(c.id);
    if (!fId && c.transfermarktId) {
      fId = tmToFotmob.get(c.transfermarktId);
    }
    return {
      ...c,
      fotmobId: fId || null,
    };
  });

  // Group by fotmobId (where fotmobId is not null)
  const byFotmob = new Map<number, any[]>();
  for (const c of clubsWithFotmob) {
    if (c.fotmobId) {
      if (!byFotmob.has(c.fotmobId)) byFotmob.set(c.fotmobId, []);
      byFotmob.get(c.fotmobId)!.push(c);
    }
  }

  console.log("\n--- Checking Duplicate Clubs by FotMob Team ID ---");
  let dupCount = 0;
  for (const [fId, list] of byFotmob.entries()) {
    if (list.length > 1) {
      dupCount++;
      console.log(`FotMob ID ${fId} (${list[0].name}) has ${list.length} club records:`);
      for (const item of list) {
        console.log(`  - ID: ${item.id}, Name: "${item.name}", TM_ID: ${item.transfermarktId}, League: ${item.leagueId}, SquadSize: ${item.squadSize}, MV: ${item.totalMarketValue}`);
      }
    }
  }
  console.log(`Total duplicate club groups by FotMob ID: ${dupCount}`);

  // Also check clubs that share similar names or mentioned in prompt:
  // Bayern Munich, AC Milan, Dortmund, Porto, Leverkusen, Tottenham, PSV, Feyenoord
  const targetNames = ["bayern", "milan", "dortmund", "porto", "leverkusen", "tottenham", "psv", "feyenoord"];
  console.log("\n--- Checking Clubs matching Target Names ---");
  for (const c of res.rows) {
    const lower = c.name.toLowerCase();
    if (targetNames.some(t => lower.includes(t))) {
      console.log(`Club: ID=${c.id}, Name="${c.name}", TM_ID=${c.transfermarktId}, League=${c.leagueId}, FotmobID=${clubIdToFotmob.get(c.id) || (c.transfermarktId ? tmToFotmob.get(c.transfermarktId) : null)}`);
    }
  }

  // Check if there are any EXT_ clubs or where EXT_ is used
  console.log("\n--- Checking for EXT_ references ---");
  const extClubs = res.rows.filter(c => c.id.startsWith("EXT_") || c.name.startsWith("EXT_") || (c.slug && c.slug.startsWith("ext_")));
  console.log(`Clubs with EXT_: ${extClubs.length}`);
  if (extClubs.length > 0) {
    console.log(extClubs);
  }

  await client.end();
}

main().catch(console.error);
