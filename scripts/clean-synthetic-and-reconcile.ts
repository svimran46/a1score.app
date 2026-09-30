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

  // 1. Remove synthetic "Without Club" expiration rows for active contracted players (Stones, Ortega, Goretzka)
  await client.query(`
    DELETE FROM "Transfer"
    WHERE "toClubName" = 'Without Club'
      AND "playerId" IN (
        SELECT id FROM "Player" WHERE "fullName" IN ('John Stones', 'Stefan Ortega', 'Leon Goretzka')
      )
  `);
  console.log("Removed synthetic 'Without Club' transfer rows for John Stones, Stefan Ortega & Leon Goretzka.");

  // 2. Detach players who actually left their clubs
  // Kolodziejczak, Goretzka, Král, Tauer, Hayden, Ebiowei, Koumas
  await client.query(`
    UPDATE "Player"
    SET "currentClubId" = NULL
    WHERE "fullName" IN (
      'Timothée Kolodziejczak',
      'Alex Král',
      'Niklas Tauer',
      'Isaac Hayden',
      'Malcolm Ebiowei',
      'Lewis Koumas'
    )
  `);
  console.log("Detached departed players from Schalke and Hull rosters.");

  // For Goretzka, assign to Bayern Munich
  const bayern = await client.query(`SELECT id FROM "Club" WHERE name ILIKE '%Bayern%'`);
  if (bayern.rows[0]) {
    await client.query(`
      UPDATE "Player"
      SET "currentClubId" = $1, "lastSeason" = 2026
      WHERE "fullName" = 'Leon Goretzka'
    `, [bayern.rows[0].id]);
    console.log("Assigned Leon Goretzka to Bayern Munich.");
  }

  // 3. Keep Schalke and Hull squadSize within bounds
  const schalke = await client.query(`SELECT id FROM "Club" WHERE name ILIKE '%Schalke%'`);
  if (schalke.rows[0]) {
    await client.query(`
      UPDATE "Club"
      SET "squadSize" = (
        SELECT COUNT(p.id) FROM "Player" p WHERE p."currentClubId" = $1
      ),
      "totalMarketValue" = (
        SELECT SUM(p."latestMarketValue") FROM "Player" p WHERE p."currentClubId" = $1
      )
      WHERE id = $1
    `, [schalke.rows[0].id]);
  }

  const hull = await client.query(`SELECT id FROM "Club" WHERE name ILIKE '%Hull City%'`);
  if (hull.rows[0]) {
    await client.query(`
      UPDATE "Club"
      SET "squadSize" = (
        SELECT COUNT(p.id) FROM "Player" p WHERE p."currentClubId" = $1
      ),
      "totalMarketValue" = (
        SELECT SUM(p."latestMarketValue") FROM "Player" p WHERE p."currentClubId" = $1
      )
      WHERE id = $1
    `, [hull.rows[0].id]);
  }

  await client.end();
  console.log("Finished cleaning synthetic transfers.");
}

main().catch(console.error);
