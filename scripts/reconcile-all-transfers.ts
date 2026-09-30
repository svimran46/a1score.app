import "dotenv/config";
import pg from "pg";
import fs from "fs";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

interface ReconcileLogRow {
  playerId: string;
  tmId: string;
  name: string;
  oldClub: string;
  newClub: string;
  reason: string;
  transferDate: string;
}

const TRACKED_LEAGUES = [
  "Premier League",
  "LaLiga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Liga Portugal",
  "Eredivisie"
];

const ALIAS_MAP: Record<string, string> = {
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
  "psv": "psv eindhoven"
};

function formatCsv(rows: ReconcileLogRow[]): string {
  const headers = ["playerId", "tmId", "name", "oldClub", "newClub", "reason", "transferDate"];
  const lines = [
    headers.join(","),
    ...rows.map(r => [
      `"${(r.playerId || "").replace(/"/g, '""')}"`,
      `"${(r.tmId || "").replace(/"/g, '""')}"`,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.oldClub || "").replace(/"/g, '""')}"`,
      `"${(r.newClub || "").replace(/"/g, '""')}"`,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      `"${(r.transferDate || "").replace(/"/g, '""')}"`
    ].join(","))
  ];
  return lines.join("\n") + "\n";
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const isDryRun = !isApply;

  console.log("=== Automated Squad & Transfer Reconciliation ===");
  console.log(`Mode: ${isApply ? "APPLY (Database writes ENABLED)" : "DRY-RUN (Default - Database writes DISABLED)"}`);
  if (isDryRun) {
    console.log("To execute updates against the database, pass the --apply flag.\n");
  } else {
    console.log("Changes will be applied to the database.\n");
  }

  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const logRows: ReconcileLogRow[] = [];

  // 1. Check/Ensure lastSyncedAt column on Club table
  const colCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Club' AND column_name = 'lastSyncedAt'
  `);
  if (colCheck.rows.length === 0) {
    if (isApply) {
      console.log("Adding lastSyncedAt column to Club table...");
      await client.query(`
        ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
    } else {
      console.log("[Dry-Run Plan] Would ensure lastSyncedAt column on Club table.");
    }
  }

  // 2. Fetch all clubs for mapping
  const clubsRes = await client.query(`
    SELECT c.id, c.name, c."transfermarktId", c."leagueId", l.name as league_name 
    FROM "Club" c
    LEFT JOIN "League" l ON c."leagueId" = l.id
  `);
  const clubByTmId = new Map<string, { id: string; name: string }>();
  const clubByName = new Map<string, { id: string; name: string }>();

  for (const c of clubsRes.rows) {
    const clubObj = { id: c.id, name: c.name };
    if (c.transfermarktId) clubByTmId.set(c.transfermarktId.trim(), clubObj);
    clubByName.set(c.name.toLowerCase().trim(), clubObj);
  }

  function resolveClubByName(toClubName: string | null): { id: string; name: string } | null {
    if (!toClubName) return null;
    const lower = toClubName.toLowerCase().trim();
    if (clubByName.has(lower)) return clubByName.get(lower)!;
    if (ALIAS_MAP[lower] && clubByName.has(ALIAS_MAP[lower])) {
      return clubByName.get(ALIAS_MAP[lower])!;
    }

    const stripped = lower.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
    for (const [name, obj] of clubByName.entries()) {
      const cStripped = name.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
      if (cStripped === stripped || cStripped === lower) return obj;
    }
    return null;
  }

  // 3. Step 3: Hardcoded Rodri block deleted entirely.
  // Note: Rodri (transfermarktId 357565) is confirmed at FC Barcelona in the database.
  // We never fabricate or INSERT Transfer rows in this reconciliation script.

  // 4. Step 4: Reconcile players with latest transfers contradicting currentClubId
  console.log("Analyzing recent transfer records since 2025-06-01...");
  const contradictory = await client.query(`
    WITH latest_transfers AS (
      SELECT DISTINCT ON ("playerId")
        "playerId",
        "toClubName",
        "fromClubName",
        "transferType",
        date
      FROM "Transfer"
      ORDER BY "playerId", date DESC
    )
    SELECT
      p.id,
      p."fullName",
      p."transfermarktId" as player_tmid,
      p."currentClubId",
      p."parentClubId",
      p.status,
      c.name as current_club_name,
      lt."toClubName",
      lt."fromClubName",
      lt."transferType",
      lt.date as transfer_date
    FROM "Player" p
    JOIN latest_transfers lt ON lt."playerId" = p.id
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE p."currentClubId" IS NOT NULL
      AND lt.date >= '2025-06-01'
  `);

  console.log(`Found ${contradictory.rows.length} players with transfers recorded since June 2025.`);

  let loanSkips = 0;
  let nameMatchWarnings = 0;
  let youthRetiredDetaches = 0;
  let tmIdMatches = 0;

  for (const row of contradictory.rows) {
    const toLower = (row.toClubName || "").toLowerCase().trim();
    const fromLower = (row.fromClubName || "").toLowerCase().trim();
    const transferDateStr = row.transfer_date instanceof Date ? row.transfer_date.toISOString().split("T")[0] : String(row.transfer_date || "");

    // 5. Loan guard: Respect the loan model (parentClubId, status = 'on_loan')
    const isLoan =
      toLower.includes("loan") ||
      toLower.includes("leih") ||
      fromLower.includes("loan") ||
      fromLower.includes("leih") ||
      row.transferType === "loan" ||
      row.parentClubId !== null ||
      row.status === "on_loan";

    if (isLoan) {
      loanSkips++;
      logRows.push({
        playerId: row.id,
        tmId: row.player_tmid || "",
        name: row.fullName,
        oldClub: row.current_club_name || "Unknown",
        newClub: row.toClubName || "Unknown",
        reason: "loan: needs manual review",
        transferDate: transferDateStr
      });
      continue;
    }

    // Check for explicit youth team, retirement, or free agent
    const isYouthOrRetired =
      toLower.includes("u17") ||
      toLower.includes("u18") ||
      toLower.includes("u19") ||
      toLower.includes("u21") ||
      toLower.includes("u23") ||
      toLower.includes("castilla") ||
      toLower.includes("b team") ||
      toLower.includes("without club") ||
      toLower.includes("retired") ||
      toLower.includes("career break") ||
      toLower.includes("end of career");

    if (isYouthOrRetired) {
      youthRetiredDetaches++;
      logRows.push({
        playerId: row.id,
        tmId: row.player_tmid || "",
        name: row.fullName,
        oldClub: row.current_club_name || "Unknown",
        newClub: "Unassigned",
        reason: `youth/retired transfer (${row.toClubName})`,
        transferDate: transferDateStr
      });

      if (isApply) {
        await client.query(`
          UPDATE "Player"
          SET "currentClubId" = NULL, "status" = 'departed'
          WHERE id = $1
        `, [row.id]);
      }
      continue;
    }

    // Rule 2: Resolve clubs ONLY by transfermarktId.
    // Name-based matching may remain ONLY to LOG a warning requiring manual confirmation — never to auto-update.
    const nameMatch = resolveClubByName(row.toClubName);
    if (nameMatch) {
      nameMatchWarnings++;
      if (nameMatch.id !== row.currentClubId) {
        console.warn(`[MANUAL CONFIRMATION REQUIRED] ${row.fullName} (${row.player_tmid || row.id}): Transfer suggests "${row.toClubName}" -> matched "${nameMatch.name}". Skipping auto-update (TM ID verification required).`);
        logRows.push({
          playerId: row.id,
          tmId: row.player_tmid || "",
          name: row.fullName,
          oldClub: row.current_club_name || "Unknown",
          newClub: nameMatch.name,
          reason: "name-based match: needs manual confirmation",
          transferDate: transferDateStr
        });
      }
    } else {
      // Unrecognized club destination outside tracked leagues
      logRows.push({
        playerId: row.id,
        tmId: row.player_tmid || "",
        name: row.fullName,
        oldClub: row.current_club_name || "Unknown",
        newClub: row.toClubName || "Unknown",
        reason: "unmatched transfer destination: needs manual review",
        transferDate: transferDateStr
      });
    }
  }

  console.log(`Step 4 Results:`);
  console.log(` - Loans skipped (safe): ${loanSkips}`);
  console.log(` - Youth/Retired detaches: ${youthRetiredDetaches} ${isDryRun ? "(dry-run)" : "(applied)"}`);
  console.log(` - Name matches flagged for manual confirmation (never auto-updated): ${nameMatchWarnings}`);

  // 6. Step 5 (Youth detach): restrict to clubs in the 7 tracked leagues,
  // players with no SeasonStats AND lastSeason < 2026; log every affected id to the CSV.
  console.log("\nAuditing unvalued youth/academy players in 7 tracked leagues without senior appearances and lastSeason < 2026...");
  const youthCandidates = await client.query(`
    SELECT
      p.id,
      p."fullName",
      p."transfermarktId" as player_tmid,
      p."latestMarketValue",
      p."dateOfBirth",
      p."lastSeason",
      p.status,
      c.id as club_id,
      c.name as club_name,
      l.name as league_name
    FROM "Player" p
    JOIN "Club" c ON p."currentClubId" = c.id
    JOIN "League" l ON c."leagueId" = l.id
    WHERE l.name = ANY($1)
      AND p."currentClubId" IS NOT NULL
      AND (p.status = 'academy' OR ("latestMarketValue" = 0 OR "latestMarketValue" IS NULL))
      AND (p."lastSeason" IS NULL OR p."lastSeason" < 2026)
      AND p.status != 'on_loan'
      AND p."parentClubId" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "SeasonStats" s WHERE s."playerId" = p.id AND s.appearances > 0
      )
  `, [TRACKED_LEAGUES]);

  console.log(`Found ${youthCandidates.rows.length} youth/academy players matching detach criteria in 7 tracked leagues.`);

  let youthDetachedCount = 0;
  for (const p of youthCandidates.rows) {
    youthDetachedCount++;
    logRows.push({
      playerId: p.id,
      tmId: p.player_tmid || "",
      name: p.fullName,
      oldClub: p.club_name,
      newClub: "Unassigned",
      reason: `youth detach: unvalued/academy with no senior stats and lastSeason < 2026 (${p.club_name})`,
      transferDate: ""
    });

    if (isApply) {
      await client.query(`
        UPDATE "Player"
        SET "currentClubId" = NULL, "status" = 'academy'
        WHERE id = $1
      `, [p.id]);
    }
  }

  // 7. Write audit CSV
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFilename = `reconcile-log-${timestamp}.csv`;
  fs.writeFileSync(logFilename, formatCsv(logRows), "utf8");
  console.log(`\nWrote ${logRows.length} audit records to: ${logFilename}`);

  // 8. Step 6: Squad aggregations consistent with Phase 1 (active = currentClubId = club AND status != 'departed')
  if (isApply) {
    console.log("\nUpdating club squad aggregates & lastSyncedAt in database...");
    await client.query(`
      UPDATE "Club" c
      SET
        "lastSyncedAt" = NOW(),
        "squadSize" = (
          SELECT COUNT(p.id)
          FROM "Player" p
          WHERE p."currentClubId" = c.id
            AND (p."status" IS NULL OR p."status" != 'departed')
            AND (p."lastSeason" IS NULL OR p."lastSeason" >= 2025)
        ),
        "totalMarketValue" = COALESCE((
          SELECT SUM(p."latestMarketValue")
          FROM "Player" p
          WHERE p."currentClubId" = c.id
            AND (p."status" IS NULL OR p."status" != 'departed')
            AND (p."lastSeason" IS NULL OR p."lastSeason" >= 2025)
        ), 0);
    `);
    console.log("Club squad aggregates successfully updated.");
  } else {
    console.log("\n[Dry-Run] Skipped database UPDATE on Club squad aggregates.");
  }

  // 9. Inspect Top Clubs Metrics
  const postCheck = await client.query(`
    SELECT name, "squadSize", "totalMarketValue", "lastSyncedAt"
    FROM "Club"
    WHERE name IN ('Real Madrid', 'Manchester City', 'FC Barcelona', 'Paris Saint-Germain', 'Arsenal FC')
    ORDER BY "totalMarketValue" DESC
  `);
  console.log("\n=== Top Club Metrics in DB ===");
  for (const c of postCheck.rows) {
    console.log(`${c.name}: Squad Size = ${c.squadSize}, Value = €${(Number(c.totalMarketValue) / 1e6).toFixed(1)}M, Synced = ${c.lastSyncedAt}`);
  }

  // 10. Final Summary
  console.log("\n=======================================================");
  console.log("=== Squad & Transfer Reconciliation Summary ===");
  console.log("=======================================================");
  console.log(`Execution Mode:                        ${isApply ? "APPLY" : "DRY-RUN (Default)"}`);
  console.log(`Database Rows Modified:                ${isApply ? (youthRetiredDetaches + youthDetachedCount) : 0}`);
  console.log(`Contradictory Transfers Inspected:     ${contradictory.rows.length}`);
  console.log(`Loans Skipped (Protected):             ${loanSkips}`);
  console.log(`Youth / Retired Transfers:             ${youthRetiredDetaches}`);
  console.log(`Name Matches Flagged (Auto-Update Skip): ${nameMatchWarnings}`);
  console.log(`Tracked League Youth Detach Candidates: ${youthCandidates.rows.length}`);
  console.log(`Total Audit Log Entries:               ${logRows.length}`);
  console.log(`Audit Log File:                        ${logFilename}`);
  console.log("=======================================================");

  await client.end();
}

main().catch(err => {
  console.error("Fatal error during reconciliation:", err);
  process.exit(1);
});
