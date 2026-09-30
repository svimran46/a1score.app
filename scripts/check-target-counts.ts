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

  console.log("=== Checking Current Baseline for Target Clubs ===");
  const targetNames = ['Real Madrid', 'Manchester City', 'FC Barcelona', 'Arsenal FC', 'Paris Saint-Germain'];
  
  for (const name of targetNames) {
    const clubRes = await client.query(`SELECT id, name, "squadSize", "totalMarketValue" FROM "Club" WHERE name = $1`, [name]);
    if (clubRes.rows.length === 0) continue;
    const club = clubRes.rows[0];

    const playersRes = await client.query(`
      SELECT id, "fullName", "latestMarketValue", "status", "lastSeason", "dateOfBirth"
      FROM "Player"
      WHERE "currentClubId" = $1
    `, [club.id]);

    const firstTeam = playersRes.rows.filter(p => p.status === 'first_team');
    const departed = playersRes.rows.filter(p => p.status === 'departed');
    const academy = playersRes.rows.filter(p => p.status === 'academy');

    console.log(`\nClub: ${club.name} (id: ${club.id})`);
    console.log(`  Club Table squadSize: ${club.squadSize}, totalVal: €${(Number(club.totalMarketValue)/1e6).toFixed(1)}M`);
    console.log(`  Player Table count with currentClubId: ${playersRes.rows.length}`);
    console.log(`  first_team status: ${firstTeam.length}, academy: ${academy.length}, departed: ${departed.length}`);
  }

  // Check Rodri
  const rodri = await client.query(`
    SELECT p.id, p."fullName", p."currentClubId", c.name as club_name, p."latestMarketValue", p."status"
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."transfermarktId" = '357565' OR p."fullName" = 'Rodri'
  `);
  console.log("\nRodri status:", rodri.rows);

  await client.end();
}

main().catch(console.error);
