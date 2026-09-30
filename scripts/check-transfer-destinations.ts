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

  const clubsRes = await client.query(`SELECT id, name, "transfermarktId", "leagueId", "squadSize" FROM "Club"`);
  console.log(`Total clubs: ${clubsRes.rows.length}`);

  // Let's check transfer table distinct toClubName and fromClubName
  const destRes = await client.query(`
    SELECT "toClubName", COUNT(*) as cnt
    FROM "Transfer"
    GROUP BY "toClubName"
    ORDER BY cnt DESC
    LIMIT 200
  `);
  console.log("\nTop 50 transfer destinations:");
  for (const r of destRes.rows.slice(0, 50)) {
    console.log(`- "${r.toClubName}": ${r.cnt}`);
  }

  // Let's check which clubs in Transfer table match our top clubs
  const targetTerms = ["tottenham", "leverkusen", "bayern", "milan", "dortmund", "porto", "psv", "feyenoord", "chelsea", "manchester", "barcelona", "madrid", "paris"];
  const allDestNames = await client.query(`SELECT DISTINCT "toClubName" FROM "Transfer" WHERE "toClubName" IS NOT NULL`);
  console.log("\nMatching transfer destinations for target clubs:");
  for (const r of allDestNames.rows) {
    const raw = r.toClubName;
    const lower = raw.toLowerCase();
    for (const term of targetTerms) {
      if (lower.includes(term)) {
        console.log(`Term [${term}] matches transfer destination: "${raw}"`);
        break;
      }
    }
  }

  await client.end();
}

main().catch(console.error);
