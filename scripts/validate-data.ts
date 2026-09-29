import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import fs from "fs";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

interface ValidationAssertion {
  id: string;
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  details?: string;
}

interface ValidationReport {
  timestamp: string;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  status: "PASSED" | "FAILED";
  assertions: ValidationAssertion[];
}

const OFFICIAL_BENCHMARKS: Record<string, { name: string; count: number }> = {
  GB1: { name: "Premier League", count: 20 },
  ES1: { name: "LaLiga", count: 20 },
  IT1: { name: "Serie A", count: 20 },
  L1: { name: "Bundesliga", count: 18 },
  FR1: { name: "Ligue 1", count: 18 },
  PO1: { name: "Liga Portugal", count: 18 },
  NL1: { name: "Eredivisie", count: 18 },
};

async function main() {
  const isJson = process.argv.includes("--json");
  const isDryRun = process.argv.includes("--dry-run") || !process.argv.includes("--apply");

  console.log("=========================================================");
  console.log(`a1score.app — Database Integrity & Assertion Suite`);
  console.log(`Mode: ${isDryRun ? "READ-ONLY AUDIT (Dry-Run)" : "APPLY"}`);
  console.log("=========================================================\n");

  const host = "aws-0-ap-northeast-1.pooler.supabase.com";
  const ips = await new Promise<string[]>((resolve, reject) => {
    dns.resolve4(host, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });

  const connStr = (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]+/, "");
  const url = new URL(connStr);

  const client = new pg.Client({
    host: ips[0],
    port: parseInt(url.port || "5432", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false, servername: host },
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL.\n");

  const assertions: ValidationAssertion[] = [];

  try {
    // ---------------------------------------------------------
    // Assertion Group 1: Season-Scoped Active League Club Counts
    // ---------------------------------------------------------
    console.log("1. Checking Season-Scoped Active League Club Counts...");
    for (const [code, benchmark] of Object.entries(OFFICIAL_BENCHMARKS)) {
      // Check count in League table
      const lRes = await client.query(
        'SELECT "clubCount", "name" FROM "League" WHERE "transfermarktId" = $1',
        [code]
      );
      const leagueCount = lRes.rows[0]?.clubCount ?? 0;

      // Check active season count in Club table
      const cRes = await client.query(
        `SELECT COUNT(c.id) as count 
         FROM "Club" c 
         JOIN "League" l ON c."leagueId" = l.id 
         WHERE l."transfermarktId" = $1 AND c."lastSeason" = 2025`,
        [code]
      );
      const activeClubCount = parseInt(cRes.rows[0]?.count || "0", 10);

      const isPass = leagueCount === benchmark.count && activeClubCount === benchmark.count;
      assertions.push({
        id: `league_count_${code}`,
        name: `${benchmark.name} (${code}) Active Club Count`,
        passed: isPass,
        expected: benchmark.count,
        actual: { leagueTable: leagueCount, activeClubsSeason2025: activeClubCount },
        details: isPass
          ? `Verified exactly ${benchmark.count} active clubs.`
          : `Mismatch: expected ${benchmark.count}, got League.clubCount=${leagueCount}, activeClubs=${activeClubCount}`,
      });

      console.log(
        `  ${isPass ? "[PASS]" : "[FAIL]"} ${benchmark.name}: Expected ${benchmark.count}, Database has ${leagueCount} (Active Season 2025: ${activeClubCount})`
      );
    }

    // ---------------------------------------------------------
    // Assertion Group 2: Player Uniqueness & Constraints
    // ---------------------------------------------------------
    console.log("\n2. Checking Player Uniqueness & Duplicate Constraints...");
    const dupRes = await client.query(`
      SELECT "transfermarktId", COUNT(*) as cnt
      FROM "Player"
      WHERE "transfermarktId" IS NOT NULL
      GROUP BY "transfermarktId"
      HAVING COUNT(*) > 1;
    `);

    const dupCount = dupRes.rows.length;
    const dupPass = dupCount === 0;
    assertions.push({
      id: "player_uniqueness",
      name: "Zero Duplicate Players (by transfermarktId)",
      passed: dupPass,
      expected: 0,
      actual: dupCount,
      details: dupPass
        ? "No duplicate transfermarktId found in Player table."
        : `Found ${dupCount} duplicated transfermarktId values.`,
    });
    console.log(
      `  ${dupPass ? "[PASS]" : "[FAIL]"} Duplicate players count: ${dupCount} (Expected: 0)`
    );

    // ---------------------------------------------------------
    // Assertion Group 3: Exactly One Valid Club Assignment
    // ---------------------------------------------------------
    console.log("\n3. Checking Player Club Assignment Integrity...");
    const orphanPlayersRes = await client.query(`
      SELECT COUNT(p.id) as orphan_count
      FROM "Player" p
      LEFT JOIN "Club" c ON p."currentClubId" = c.id
      WHERE p."currentClubId" IS NOT NULL AND c.id IS NULL;
    `);

    const orphanCount = parseInt(orphanPlayersRes.rows[0].orphan_count, 10);
    const orphanPass = orphanCount === 0;
    assertions.push({
      id: "player_club_foreign_keys",
      name: "Zero Orphan Player-Club Foreign Keys",
      passed: orphanPass,
      expected: 0,
      actual: orphanCount,
      details: orphanPass
        ? "All assigned players link to valid existing Club records."
        : `Found ${orphanCount} players referencing non-existent clubs.`,
    });
    console.log(
      `  ${orphanPass ? "[PASS]" : "[FAIL]"} Orphan player-club links: ${orphanCount} (Expected: 0)`
    );

    // ---------------------------------------------------------
    // Assertion Group 4: Financial Valuation Sanity Checks
    // ---------------------------------------------------------
    console.log("\n4. Checking Financial Valuation Non-Negativity...");
    const negValRes = await client.query(`
      SELECT COUNT(id) as count FROM "Player" WHERE "latestMarketValue" < 0;
    `);
    const negValCount = parseInt(negValRes.rows[0].count, 10);
    const negValPass = negValCount === 0;
    assertions.push({
      id: "valuation_non_negative",
      name: "Zero Negative Player Market Valuations",
      passed: negValPass,
      expected: 0,
      actual: negValCount,
      details: negValPass ? "All player valuations are non-negative." : `Found ${negValCount} negative valuations.`,
    });
    console.log(
      `  ${negValPass ? "[PASS]" : "[FAIL]"} Negative player market values: ${negValCount} (Expected: 0)`
    );

    // ---------------------------------------------------------
    // Assertion Group 5: Commercial Transfer Fee Sanity Checks
    // ---------------------------------------------------------
    console.log("\n5. Checking Commercial Transfer Records Integrity...");
    const negFeeRes = await client.query(`
      SELECT COUNT(id) as count FROM "Transfer" WHERE "feeEur" < 0;
    `);
    const negFeeCount = parseInt(negFeeRes.rows[0].count, 10);
    const negFeePass = negFeeCount === 0;
    assertions.push({
      id: "transfer_fees_non_negative",
      name: "Zero Negative Commercial Transfer Fees",
      passed: negFeePass,
      expected: 0,
      actual: negFeeCount,
      details: negFeePass ? "All transfer fees are non-negative." : `Found ${negFeeCount} negative fees.`,
    });
    console.log(
      `  ${negFeePass ? "[PASS]" : "[FAIL]"} Negative transfer fees: ${negFeeCount} (Expected: 0)`
    );

    // Orphan Transfers Check
    const orphanTransferRes = await client.query(`
      SELECT COUNT(t.id) as count
      FROM "Transfer" t
      LEFT JOIN "Player" p ON t."playerId" = p.id
      WHERE p.id IS NULL;
    `);
    const orphanTransferCount = parseInt(orphanTransferRes.rows[0].count, 10);
    const orphanTransferPass = orphanTransferCount === 0;
    assertions.push({
      id: "transfer_player_foreign_keys",
      name: "Zero Orphan Transfer-Player Foreign Keys",
      passed: orphanTransferPass,
      expected: 0,
      actual: orphanTransferCount,
      details: orphanTransferPass
        ? "All transfers link to existing Player records."
        : `Found ${orphanTransferCount} orphan transfers.`,
    });
    console.log(
      `  ${orphanTransferPass ? "[PASS]" : "[FAIL]"} Orphan transfers: ${orphanTransferCount} (Expected: 0)`
    );

    // ---------------------------------------------------------
    // Assertion Group 6: League Foreign Key Integrity
    // ---------------------------------------------------------
    console.log("\n6. Checking Club-League Foreign Key Integrity...");
    const orphanClubsRes = await client.query(`
      SELECT COUNT(c.id) as count
      FROM "Club" c
      LEFT JOIN "League" l ON c."leagueId" = l.id
      WHERE c."leagueId" IS NOT NULL AND l.id IS NULL;
    `);
    const orphanClubCount = parseInt(orphanClubsRes.rows[0].count, 10);
    const orphanClubPass = orphanClubCount === 0;
    assertions.push({
      id: "club_league_foreign_keys",
      name: "Zero Orphan Club-League Foreign Keys",
      passed: orphanClubPass,
      expected: 0,
      actual: orphanClubCount,
      details: orphanClubPass
        ? "All clubs link to valid League records."
        : `Found ${orphanClubCount} clubs referencing non-existent leagues.`,
    });
    console.log(
      `  ${orphanClubPass ? "[PASS]" : "[FAIL]"} Orphan club-league links: ${orphanClubCount} (Expected: 0)`
    );

    // ---------------------------------------------------------
    // Summary & JSON Report Generation
    // ---------------------------------------------------------
    const total = assertions.length;
    const passed = assertions.filter((a) => a.passed).length;
    const failed = total - passed;
    const overallStatus = failed === 0 ? "PASSED" : "FAILED";

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      totalAssertions: total,
      passedAssertions: passed,
      failedAssertions: failed,
      status: overallStatus,
      assertions,
    };

    // Save JSON report if requested or always in artifacts/reports
    fs.writeFileSync("data-validation-report.json", JSON.stringify(report, null, 2), "utf-8");
    console.log(`\nMachine-readable report written to data-validation-report.json`);

    console.log("\n=========================================================");
    console.log(`FINAL RESULT: ${overallStatus} (${passed}/${total} assertions passed)`);
    console.log("=========================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error during validation:", err);
  process.exit(1);
});
