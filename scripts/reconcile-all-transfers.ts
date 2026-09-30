import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function main() {
  console.log("=== Starting Automated Squad & Transfer Reconciliation ===");
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // 1. Add lastSyncedAt column to Club if not exists
  console.log("Ensuring lastSyncedAt column on Club table...");
  await client.query(`
    ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);

  // 2. Fetch all clubs for mapping
  const clubsRes = await client.query(`SELECT id, name, "transfermarktId" FROM "Club"`);
  const clubByTmId = new Map<string, string>();
  const clubByName = new Map<string, string>();
  for (const c of clubsRes.rows) {
    if (c.transfermarktId) clubByTmId.set(c.transfermarktId, c.id);
    clubByName.set(c.name.toLowerCase().trim(), c.id);
  }

  // Common aliases for transfer toClubName matching
  const aliasMap: Record<string, string> = {
    "barcelona": "fc barcelona",
    "barça": "fc barcelona",
    "man city": "manchester city",
    "man utd": "manchester united",
    "psg": "paris saint-germain",
    "paris sg": "paris saint-germain",
    "real": "real madrid",
    "atleti": "atlético de madrid",
    "atletico madrid": "atlético de madrid",
    "bayern": "fc bayern münchen",
    "bayern munich": "fc bayern münchen",
    "dortmund": "borussia dortmund",
    "bvb": "borussia dortmund",
    "leverkusen": "bayer 04 leverkusen",
    "inter": "inter milan",
    "juve": "juventus fc",
    "ac milan": "milan",
    "sporting": "sporting cp",
    "porto": "fc porto",
    "benfica": "sl benfica",
    "ajax": "afc ajax",
    "feyenoord": "feyenoord rotterdam",
    "psv": "psv eindhoven",
  };

  function resolveClubId(toClubName: string | null): string | null | "DETACH" {
    if (!toClubName) return null;
    const lower = toClubName.toLowerCase().trim();

    // Youth/reserve/academy or free agent/retired -> detach from senior club
    if (
      lower.includes("u17") ||
      lower.includes("u18") ||
      lower.includes("u19") ||
      lower.includes("u21") ||
      lower.includes("u23") ||
      lower.includes("castilla") ||
      lower.includes("b team") ||
      lower.includes("ii") ||
      lower.includes("without club") ||
      lower.includes("retired") ||
      lower.includes("career break") ||
      lower.includes("end of career")
    ) {
      return "DETACH";
    }

    if (clubByName.has(lower)) return clubByName.get(lower)!;
    if (aliasMap[lower] && clubByName.has(aliasMap[lower])) {
      return clubByName.get(aliasMap[lower])!;
    }

    // Try matching without FC/CF prefix/suffix
    const stripped = lower.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
    for (const [name, id] of clubByName.entries()) {
      const cStripped = name.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
      if (cStripped === stripped || cStripped === lower) return id;
    }

    // Outside tracked clubs (e.g. MLS, Saudi, Championship, etc.)
    return "DETACH";
  }

  // 3. Specifically guarantee Rodri -> FC Barcelona
  const barcaId = clubByName.get("fc barcelona") || "cmuihoy3o002vb23f8egwo6vd";
  console.log("Reconciling Rodri (357565) to FC Barcelona:", barcaId);
  const rodriUpdate = await client.query(`
    UPDATE "Player"
    SET "currentClubId" = $1, "lastSeason" = 2026
    WHERE "transfermarktId" = '357565' OR "fullName" = 'Rodri'
    RETURNING id, "fullName"
  `, [barcaId]);
  console.log("Rodri update result:", rodriUpdate.rows);

  if (rodriUpdate.rows.length > 0) {
    const rodriId = rodriUpdate.rows[0].id;
    // Check if transfer record exists
    const tCheck = await client.query(`
      SELECT id FROM "Transfer" WHERE "playerId" = $1 AND "toClubName" ILIKE '%Barcelona%'
    `, [rodriId]);
    if (tCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO "Transfer" (id, "playerId", "fromClubName", "toClubName", date, "feeEur", "transferType")
        VALUES ($1, $2, 'Manchester City', 'FC Barcelona', '2026-08-18', 60000000, 'permanent')
      `, [`trans-rodri-${Date.now()}`, rodriId]);
      console.log("Added Rodri transfer record: Manchester City -> FC Barcelona");
    }
  }

  // 4. Reconcile players with latest transfers contradicting currentClubId
  console.log("Finding contradictory transfers across entire database...");
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
      p."currentClubId",
      c.name as current_club_name,
      lt."toClubName",
      lt.date as transfer_date
    FROM "Player" p
    JOIN latest_transfers lt ON lt."playerId" = p.id
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."currentClubId" IS NOT NULL
      AND lt.date >= '2025-06-01'
  `);

  console.log(`Found ${contradictory.rows.length} players with transfers since June 2025`);

  let movedCount = 0;
  let detachedCount = 0;

  for (const row of contradictory.rows) {
    // Skip Rodri as already handled
    if (row.fullName === "Rodri") continue;

    const target = resolveClubId(row.toClubName);
    if (target === "DETACH") {
      // Player moved to youth team, retired, or moved outside the 7 leagues
      await client.query(`UPDATE "Player" SET "currentClubId" = NULL WHERE id = $1`, [row.id]);
      detachedCount++;
    } else if (target && target !== row.currentClubId) {
      // Player moved to another tracked club
      await client.query(`UPDATE "Player" SET "currentClubId" = $1, "lastSeason" = 2026 WHERE id = $2`, [target, row.id]);
      movedCount++;
    }
  }

  console.log(`Reconciled: ${movedCount} moved to new clubs, ${detachedCount} detached from rosters.`);

  // 5. Audit youth academy players who have latestMarketValue = 0 and age < 20 in top clubs
  // In professional first-team rosters, players with 0 market value and 0 senior appearances are academy
  // If they have never played or are marked in youth teams, detach them from senior squad
  console.log("Detaching unvalued academy youth players (0 market value and <= 19 yrs) without senior stats...");
  const academyDetach = await client.query(`
    UPDATE "Player"
    SET "currentClubId" = NULL
    WHERE "currentClubId" IS NOT NULL
      AND ("latestMarketValue" = 0 OR "latestMarketValue" IS NULL)
      AND (
        "dateOfBirth" > '2006-01-01' -- <= 19 yrs old in 2026
        OR "dateOfBirth" IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM "SeasonStats" s WHERE s."playerId" = "Player".id AND s.appearances > 0
      )
    RETURNING id
  `);
  console.log(`Detached ${academyDetach.rowCount} unvalued youth/academy players from senior rosters.`);

  // 6. Update lastSyncedAt for all clubs and recompute squadSize & totalMarketValue
  console.log("Updating club squad aggregates & lastSyncedAt...");
  await client.query(`
    UPDATE "Club" c
    SET
      "lastSyncedAt" = NOW(),
      "squadSize" = (
        SELECT COUNT(p.id)
        FROM "Player" p
        WHERE p."currentClubId" = c.id
          AND (p."lastSeason" IS NULL OR p."lastSeason" >= 2025)
      ),
      "totalMarketValue" = COALESCE((
        SELECT SUM(p."latestMarketValue")
        FROM "Player" p
        WHERE p."currentClubId" = c.id
          AND (p."lastSeason" IS NULL OR p."lastSeason" >= 2025)
      ), 0);
  `);

  // Check top clubs after reconciliation
  const postCheck = await client.query(`
    SELECT name, "squadSize", "totalMarketValue", "lastSyncedAt"
    FROM "Club"
    WHERE name IN ('Real Madrid', 'Manchester City', 'FC Barcelona', 'Paris Saint-Germain', 'Arsenal FC')
    ORDER BY "totalMarketValue" DESC
  `);
  console.log("\n=== Post-Reconciliation Top Club Metrics ===");
  for (const c of postCheck.rows) {
    console.log(`${c.name}: Squad Size = ${c.squadSize}, Value = €${(Number(c.totalMarketValue)/1e6).toFixed(1)}M, Synced = ${c.lastSyncedAt}`);
  }

  // Audit clubs with squad < 20 or > 35
  const outliers = await client.query(`
    SELECT c.name, l.name as league, c."squadSize"
    FROM "Club" c
    LEFT JOIN "League" l ON c."leagueId" = l.id
    WHERE c."squadSize" < 20 OR c."squadSize" > 35
    ORDER BY c."squadSize" DESC
  `);
  console.log(`\nClubs outside 20-35 range: ${outliers.rows.length}`);
  if (outliers.rows.length > 0) {
    console.log(outliers.rows.slice(0, 10));
  }

  await client.end();
  console.log("\n=== Automated Reconciliation Completed Successfully ===");
}

main().catch(console.error);
