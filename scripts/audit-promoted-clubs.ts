import "dotenv/config";
import pg from "pg";
import { fotmobFetch } from "../src/lib/fotmob/client";
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

  console.log("=== Auditing Promoted & Newly Ingested Clubs ===");
  const targetNames = [
    "Hull City",
    "FC Schalke 04",
    "Coventry City",
    "Ipswich Town",
    "SV Elversberg",
    "Racing Santander",
    "Real Valladolid CF",
    "Espanyol",
    "Como",
    "Parma",
    "Venezia",
    "FC St. Pauli",
    "Holstein Kiel",
    "AJ Auxerre",
    "Angers SCO",
    "AS Saint-Étienne",
  ];

  for (const name of targetNames) {
    const clubRes = await client.query(
      `SELECT id, name, "transfermarktId", "squadSize", "totalMarketValue", "leagueId" FROM "Club" WHERE name ILIKE $1`,
      [`%${name}%`]
    );

    if (clubRes.rows.length === 0) {
      console.log(`Club NOT FOUND in DB: ${name}`);
      continue;
    }

    const club = clubRes.rows[0];
    const playersRes = await client.query(
      `SELECT id, "fullName", "transfermarktId", "latestMarketValue", "status", "lastSeason" FROM "Player" WHERE "currentClubId" = $1`,
      [club.id]
    );

    // Find FotMob ID
    let fotmobId: number | null = null;
    for (const [fIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
      if (m.clubId === club.id || (club.transfermarktId && m.tmId === club.transfermarktId) || m.name?.toLowerCase() === club.name.toLowerCase()) {
        fotmobId = Number(fIdStr);
        break;
      }
    }

    let fotmobCount = 0;
    if (fotmobId) {
      try {
        const fmData = await fotmobFetch<any>(`/api/data/teams?id=${fotmobId}`, 3600);
        if (fmData?.squad?.squad) {
          const groups = fmData.squad.squad.filter((g: any) => g.title !== "coach");
          fotmobCount = groups.flatMap((g: any) => g.members || []).length;
        }
      } catch (err: any) {
        // ignore
      }
    }

    console.log(`\nClub: ${club.name} (DB ID: ${club.id}, TM ID: ${club.transfermarktId}, FotMob ID: ${fotmobId || 'N/A'})`);
    console.log(`  DB Roster Count: ${playersRes.rows.length} players (First Team: ${playersRes.rows.filter(p => p.status === 'first_team').length}, Value: €${(Number(club.totalMarketValue)/1e6).toFixed(1)}M)`);
    console.log(`  FotMob Current Squad Count: ${fotmobCount} players`);
  }

  await client.end();
}

main().catch(console.error);
