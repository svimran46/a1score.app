import { supabase } from "../src/lib/supabase";
import { OFFICIAL_LEAGUE_CLUB_COUNTS } from "../src/lib/fotmob/client";

async function main() {
  console.log("=== A1Score Data Integrity Validation ===\n");
  let hasErrors = false;

  // 1. Validate League Counts
  console.log("1. Validating Top Flight League Configurations...");
  const expectedCounts: Record<string, { name: string; expected: number }> = {
    GB1: { name: "Premier League", expected: 20 },
    ES1: { name: "LaLiga", expected: 20 },
    IT1: { name: "Serie A", expected: 20 },
    L1: { name: "Bundesliga", expected: 18 },
    FR1: { name: "Ligue 1", expected: 18 },
  };

  for (const [code, info] of Object.entries(expectedCounts)) {
    const configuredCount = OFFICIAL_LEAGUE_CLUB_COUNTS[code];
    if (configuredCount === info.expected) {
      console.log(`  [PASS] ${info.name} (${code}): configured for official ${configuredCount} clubs`);
    } else {
      console.error(`  [FAIL] ${info.name} (${code}): expected ${info.expected}, found ${configuredCount}`);
      hasErrors = true;
    }
  }

  // 2. Validate Database Connectivity & Player Valuations
  console.log("\n2. Validating Player Valuations...");
  const { data: topPlayers, error: pErr } = await supabase
    .from("Player")
    .select("fullName, latestMarketValue")
    .order("latestMarketValue", { ascending: false })
    .limit(5);

  if (pErr || !topPlayers || topPlayers.length === 0) {
    console.error("  [FAIL] Could not query top players:", pErr);
    hasErrors = true;
  } else {
    console.log(`  [PASS] Successfully queried ${topPlayers.length} top players:`);
    for (const p of topPlayers) {
      console.log(`    - ${p.fullName}: €${(Number(p.latestMarketValue) / 1e6).toFixed(1)}M`);
    }
  }

  // 3. Validate Transfers Table Sanity
  console.log("\n3. Validating Transfer Records Integrity...");
  const { data: negativeFees, error: tErr } = await supabase
    .from("Transfer")
    .select("id, feeEur")
    .lt("feeEur", 0)
    .limit(1);

  if (tErr) {
    console.error("  [FAIL] Error querying transfers:", tErr);
    hasErrors = true;
  } else if (negativeFees && negativeFees.length > 0) {
    console.error("  [FAIL] Detected negative transfer fee in database!");
    hasErrors = true;
  } else {
    console.log("  [PASS] All transfer fees are non-negative and properly formed.");
  }

  // Final Summary
  console.log("\n==========================================");
  if (hasErrors) {
    console.error("DATA VALIDATION FAILED. Please review the errors above.");
    process.exit(1);
  } else {
    console.log("DATA VALIDATION PASSED. All integrity constraints verified.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error during validation:", err);
  process.exit(1);
});
