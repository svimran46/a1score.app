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

  console.log("=== 1. FULL RECORD FOR BARA SAPOKO NDIAYE ===");
  const baraRes = await client.query(`
    SELECT *
    FROM "Player"
    WHERE id = 'cmuihw4st0d7wsexpdqcqf3cq'
  `);
  console.log(JSON.stringify(baraRes.rows[0], null, 2));

  // Check recent transfers for Bara
  const baraTransfers = await client.query(`
    SELECT * FROM "Transfer" WHERE "playerId" = 'cmuihw4st0d7wsexpdqcqf3cq' ORDER BY date DESC
  `);
  console.log("Bara Transfers:", baraTransfers.rows);

  console.log("\n=== 2. THOROUGH MATCH CHECK FOR ALL 9 'CREATE NEW PLAYER' ROWS ===");
  const targetNewPlayers = [
    { name: "Josh Wilson-Esbrand", id: "FM_1187225", club: "Manchester City", parts: ["Josh", "Wilson", "Esbrand"] },
    { name: "Allan", id: "FM_1721789", club: "Manchester City", parts: ["Allan"] },
    { name: "Christos Tzolis", id: "FM_1157237", club: "Arsenal FC", parts: ["Christos", "Tzolis"] },
    { name: "João Cancelo", id: "FM_361757", club: "FC Barcelona", parts: ["Joao", "Cancelo"] },
    { name: "Brian Fariñas", id: "FM_1821727", club: "FC Barcelona", parts: ["Brian", "Farinas"] },
    { name: "Jesse Bisiwu", id: "FM_1656591", club: "FC Barcelona", parts: ["Jesse", "Bisiwu"] },
    { name: "Hamza Abdelkarim", id: "FM_1708842", club: "FC Barcelona", parts: ["Hamza", "Abdelkarim"] },
    { name: "Bara Ndiaye", id: "FM_1798782", club: "Bayern Munich", parts: ["Bara", "Ndiaye"] },
    { name: "Alessandro Longoni", id: "FM_1662399", club: "Paris Saint-Germain", parts: ["Alessandro", "Longoni"] },
  ];

  for (const p of targetNewPlayers) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Checking [${p.name}] (target club: ${p.club}, ID: ${p.id}):`);

    // Exact ILIKE match
    const exact = await client.query(
      `SELECT p.id, p."fullName", p."currentClubId", c.name as club_name, p.status, p."position", p."transfermarktId", p."dateOfBirth"
       FROM "Player" p
       LEFT JOIN "Club" c ON p."currentClubId" = c.id
       WHERE p."fullName" ILIKE $1`,
      [`%${p.name}%`]
    );

    // Partial / individual word matches
    const conditions = p.parts.map((_, idx) => `p."fullName" ILIKE $${idx + 1}`);
    const partial = await client.query(
      `SELECT p.id, p."fullName", p."currentClubId", c.name as club_name, p.status, p."position", p."transfermarktId", p."dateOfBirth"
       FROM "Player" p
       LEFT JOIN "Club" c ON p."currentClubId" = c.id
       WHERE ${conditions.join(" OR ")}
       LIMIT 10`,
      p.parts.map(part => `%${part}%`)
    );

    console.log(`Exact/substring matches count: ${exact.rows.length}`);
    for (const r of exact.rows) {
      console.log(`  EXACT: [${r.id}] "${r.fullName}" | Club: ${r.club_name || 'null'} | Pos: ${r.position} | Status: ${r.status} | TM: ${r.transfermarktId} | DoB: ${r.dateOfBirth?.toISOString().split('T')[0]}`);
    }

    console.log(`Partial word matches count: ${partial.rows.length}`);
    for (const r of partial.rows) {
      if (!exact.rows.some(e => e.id === r.id)) {
        console.log(`  PARTIAL: [${r.id}] "${r.fullName}" | Club: ${r.club_name || 'null'} | Pos: ${r.position} | Status: ${r.status} | TM: ${r.transfermarktId} | DoB: ${r.dateOfBirth?.toISOString().split('T')[0]}`);
      }
    }
  }

  await client.end();
}

main().catch(console.error);
