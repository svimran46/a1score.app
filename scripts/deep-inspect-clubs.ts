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

  console.log("=== Deep Inspection of Club Records ===");

  // Check the IDs that were in KNOWN_CLUB_ALIASES:
  const idsToCheck = [
    "cmuihq20u0051h29eqd33306v",
    "cmuihq5a9006xh29ec23q346o",
    "cmuihpzb6003ph29et2b947q5",
    "cmuihpy4m0031h29ehfq24q6s",
    "cmuihpzls003rh29eei7m0j69",
    "cmuihq82e008lh29eglfc8yff",
    "cmuihq3qa0061h29eyxx4xw43",
    "cmuihqb6900a7h29eb12tdj1t",
    "cmuihq09e0045h29ednnt1hkq",
    "cmuihqe6h00brh29ew01veugs"
  ];

  const checkRes = await client.query(`
    SELECT id, name, "transfermarktId", "leagueId", "squadSize"
    FROM "Club"
    WHERE id = ANY($1)
  `, [idsToCheck]);

  console.log("\nQuerying check IDs in Club table:");
  for (const r of checkRes.rows) {
    console.log(`- ${r.id}: "${r.name}" (tmId=${r.transfermarktId}, squad=${r.squadSize})`);
  }

  // Check all clubs in DB that contain: bayern, milan, dortmund, porto, leverkusen, tottenham, psv, feyenoord, spurs
  const terms = ["bayern", "milan", "dortmund", "porto", "leverkusen", "tottenham", "psv", "feyenoord", "spurs"];
  console.log("\nAll clubs in DB matching terms:");
  const allRes = await client.query(`SELECT id, name, "transfermarktId", "leagueId", "squadSize", "totalMarketValue" FROM "Club"`);
  for (const c of allRes.rows) {
    const n = c.name.toLowerCase();
    if (terms.some(t => n.includes(t))) {
      console.log(`MATCH: "${c.name}" | ID: ${c.id} | tmId: ${c.transfermarktId} | leagueId: ${c.leagueId} | squad: ${c.squadSize}`);
    }
  }

  // Check FOTMOB_TEAM_MAPPINGS for those teams
  console.log("\nFOTMOB_TEAM_MAPPINGS matching terms:");
  for (const [fId, item] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const n = (item.name || "").toLowerCase();
    if (terms.some(t => n.includes(t))) {
      console.log(`FOTMOB ${fId}: name="${item.name}", tmId=${item.tmId}, clubId=${item.clubId}`);
    }
  }

  // Check if there are other clubs in DB with identical/similar names
  console.log("\nFinding clubs with similar names in DB:");
  const byNorm = new Map<string, any[]>();
  for (const c of allRes.rows) {
    const norm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!byNorm.has(norm)) byNorm.set(norm, []);
    byNorm.get(norm)!.push(c);
  }
  for (const [norm, list] of byNorm.entries()) {
    if (list.length > 1) {
      console.log(`Exact norm duplicate: "${norm}" ->`, list.map(x => `${x.id} (${x.name})`));
    }
  }

  // Check if Player or Transfer tables reference non-existent clubs or multiple clubs for the same team
  console.log("\nChecking Player currentClubId distribution for Bayern, Milan, etc:");
  const pRes = await client.query(`
    SELECT p."currentClubId", c.name, COUNT(*) as cnt
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE c.name ILIKE '%bayern%' OR c.name ILIKE '%milan%' OR c.name ILIKE '%dortmund%' OR c.name ILIKE '%porto%' OR c.name ILIKE '%leverkusen%' OR c.name ILIKE '%tottenham%' OR c.name ILIKE '%psv%' OR c.name ILIKE '%feyenoord%'
    GROUP BY p."currentClubId", c.name
  `);
  for (const r of pRes.rows) {
    console.log(`Player Club: ${r.currentClubId} (${r.name}): ${r.cnt} players`);
  }

  await client.end();
}

main().catch(console.error);
