import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

async function runNightlyIntegrityCheck() {
  console.log("===============================================================");
  console.log("             A1SCORE NIGHTLY SQUAD INTEGRITY AUDIT             ");
  console.log("===============================================================\n");

  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();

  let hasFatalErrors = false;
  const warnings: string[] = [];
  const errors: string[] = [];

  // --- Check 1: Stale Clubs (> 48h since sync) ---
  console.log("--- 1. Auditing Club Sync Freshness (Max 48h Stale Limit) ---");
  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const staleClubs = await client.query(`
    SELECT id, name, "lastSyncedAt"
    FROM "Club"
    WHERE "lastSyncedAt" IS NULL OR "lastSyncedAt" < $1
    ORDER BY "lastSyncedAt" ASC NULLS FIRST
  `, [staleThreshold.toISOString()]);

  if (staleClubs.rows.length > 0) {
    const msg = `Found ${staleClubs.rows.length} clubs not synced in > 48h: ${staleClubs.rows.slice(0, 5).map(c => c.name).join(", ")}...`;
    errors.push(msg);
    console.error(`❌ [FAIL] ${msg}`);
  } else {
    console.log(`✅ [PASS] All clubs synced within the last 48 hours.`);
  }

  // --- Check 2: Contradictory Transfers ---
  console.log("\n--- 2. Auditing Player-Club Transfer Parity ---");
  const contradictory = await client.query(`
    WITH latest_transfers AS (
      SELECT DISTINCT ON ("playerId")
        "playerId",
        "toClubName",
        "fromClubName",
        date
      FROM "Transfer"
      ORDER BY "playerId", date DESC
    )
    SELECT
      p.id,
      p."fullName",
      p."transfermarktId",
      c.name as current_club_name,
      lt."toClubName",
      lt.date as transfer_date
    FROM "Player" p
    JOIN latest_transfers lt ON lt."playerId" = p.id
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."currentClubId" IS NOT NULL
      AND lt.date >= '2025-06-01'
      AND lt."toClubName" IS NOT NULL
      AND (
        lt."toClubName" ILIKE '%Without Club%'
        OR lt."toClubName" ILIKE '%Retired%'
        OR lt."toClubName" ILIKE '%U18%'
        OR lt."toClubName" ILIKE '%U19%'
        OR lt."toClubName" ILIKE '%U21%'
      )
  `);

  if (contradictory.rows.length > 0) {
    const msg = `Found ${contradictory.rows.length} players whose latest transfer directly contradicts active squad membership (e.g. retired or youth squad):`;
    errors.push(msg);
    console.error(`❌ [FAIL] ${msg}`);
    for (const row of contradictory.rows.slice(0, 10)) {
      console.error(`   - ${row.fullName} is at ${row.current_club_name} but latest transfer is to '${row.toClubName}' (${row.transfer_date})`);
    }
  } else {
    console.log(`✅ [PASS] Zero contradictory departure/retirement transfers detected.`);
  }

  // Specifically verify Rodri is at Barcelona
  const rodriCheck = await client.query(`
    SELECT p.id, p."fullName", c.name as club_name
    FROM "Player" p
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."transfermarktId" = '357565' OR p."fullName" = 'Rodri'
  `);
  const rodriClub = rodriCheck.rows[0]?.club_name;
  if (rodriClub === "FC Barcelona") {
    console.log(`✅ [PASS] Rodri canonical club assignment: FC Barcelona.`);
  } else {
    const msg = `Rodri is assigned to '${rodriClub}', expected FC Barcelona!`;
    errors.push(msg);
    console.error(`❌ [FAIL] ${msg}`);
  }

  // --- Check 3: First-Team Squad Size Bounds (20 - 35 players) ---
  console.log("\n--- 3. Auditing First-Team Squad Sizes (20–35 player bounds) ---");
  const topFlightClubs = await client.query(`
    SELECT c.id, c.name, l.name as league_name, c."squadSize", c."totalMarketValue"
    FROM "Club" c
    JOIN "League" l ON c."leagueId" = l.id
    ORDER BY c."squadSize" DESC
  `);

  const topClubNames = ["Real Madrid", "Manchester City", "FC Barcelona", "Paris Saint-Germain", "Arsenal FC"];
  for (const c of topFlightClubs.rows) {
    const size = c.squadSize || 0;
    if (topClubNames.includes(c.name)) {
      if (size >= 20 && size <= 35) {
        console.log(`✅ [PASS] Core Club [${c.name}]: Squad size ${size} is cleanly within 20-35 bounds.`);
      } else {
        const msg = `Core Club [${c.name}] has squad size ${size}, outside 20-35 bounds!`;
        errors.push(msg);
        console.error(`❌ [FAIL] ${msg}`);
      }
    }
  }

  const severeOutliers = topFlightClubs.rows.filter(c => (c.squadSize || 0) < 16 || (c.squadSize || 0) > 40);
  if (severeOutliers.length > 0) {
    warnings.push(`${severeOutliers.length} clubs have abnormal rosters (<16 or >40): ${severeOutliers.slice(0, 5).map(c => `${c.name} (${c.squadSize})`).join(", ")}`);
  }

  await client.end();

  console.log("\n===============================================================");
  if (errors.length > 0) {
    console.error(`🚨 INTEGRITY CHECK FAILED WITH ${errors.length} FATAL ERROR(S):`);
    errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
    process.exit(1);
  } else {
    if (warnings.length > 0) {
      console.warn(`⚠️ Completed with ${warnings.length} warning(s):`);
      warnings.forEach((w, idx) => console.warn(`  ${idx + 1}. ${w}`));
    }
    console.log("✨ ALL NIGHTLY SQUAD INTEGRITY CHECKS PASSED SUCCESSFULLY!");
    console.log("===============================================================");
    process.exit(0);
  }
}

runNightlyIntegrityCheck().catch((err) => {
  console.error("Fatal error running nightly integrity check:", err);
  process.exit(1);
});
