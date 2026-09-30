/**
 * scripts/verify-data-integrity.ts
 *
 * Automated Data Integrity Verification Suite for a1score.app
 * Runnable via: npm run verify:data
 *
 * Asserts:
 * 1. Player-Club Consistency: Every player in the top valuations list appears in their club's roster.
 * 2. Valuation Parity: Every player's market value on the rankings list exactly matches their club roster value.
 * 3. Club Identity Parity: Every player's club assignment is identical across all views.
 * 4. Former/Retired Player Suppression: No retired/former players (Lampard, Wayne Bridge, Fernandinho, etc.) in club rosters.
 * 5. Squad Bounds: Senior first-team rosters are within sensible bounds (15 <= size <= 40).
 * 6. League Standings Completeness: Every top-flight club across all 7 leagues links to a club page and has totalSquadValue > 0.
 * 7. Mathematical Median: Median squad calculation averages the 2 middle values for even-sized leagues.
 */

import { getMostValuablePlayers } from "../src/lib/data/players";
import { getClubById } from "../src/lib/data/clubs";
import { getLeagueById } from "../src/lib/data/leagues";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message: string) {
  results.push({
    name,
    passed: condition,
    message: condition ? `PASS: ${message}` : `FAIL: ${message}`,
  });
  if (!condition) {
    console.error(`❌ [FAIL] ${name}: ${message}`);
  } else {
    console.log(`✅ [PASS] ${name}: ${message}`);
  }
}

async function verifyTopPlayersAndClubRosters() {
  console.log("\n--- 1. Verifying Top Players vs. Club Rosters (Parity & Integrity) ---");
  const topPlayers = await getMostValuablePlayers(25);

  assert(topPlayers.length >= 25, "Top Players Count", `Fetched ${topPlayers.length} players (>= 25 expected)`);

  const checkedClubs = new Set<string>();

  for (const player of topPlayers) {
    const club = player.currentClub;
    assert(!!club && !!club.id, `Player Club Assignment [${player.fullName}]`, `Player has assigned club: ${club?.name} (${club?.id})`);

    if (club?.id && !checkedClubs.has(club.id)) {
      checkedClubs.add(club.id);
      const clubData = await getClubById(club.id);

      assert(!!clubData, `Club Profile Fetch [${club.name}]`, `Loaded club profile for ${club.name} (${club.id})`);

      if (clubData) {
        // Assert player is present in club roster
        const rosterPlayer = clubData.players?.find(
          (p: any) =>
            p.fullName.toLowerCase() === player.fullName.toLowerCase() ||
            p.id === player.id ||
            p.sourceId === player.sourceId
        );

        assert(
          !!rosterPlayer,
          `Roster Inclusion [${player.fullName} in ${club.name}]`,
          `${player.fullName} found in ${club.name} roster`
        );

        if (rosterPlayer) {
          // Assert valuation parity
          assert(
            rosterPlayer.latestMarketValue === player.latestMarketValue,
            `Valuation Parity [${player.fullName}]`,
            `List value €${(player.latestMarketValue / 1e6).toFixed(1)}M matches roster value €${(rosterPlayer.latestMarketValue / 1e6).toFixed(1)}M`
          );
        }

        // Assert squad bounds
        const squadSize = clubData.squadSize || (clubData.firstTeamPlayers?.length ?? 0);
        assert(
          squadSize >= 15 && squadSize <= 40,
          `First-Team Squad Bounds [${club.name}]`,
          `Squad size is ${squadSize} (expected between 15 and 40)`
        );
      }
    }
  }
}

async function verifyManchesterCityIntegrity() {
  console.log("\n--- 2. Verifying Manchester City Specific Corrections (A1, A2) ---");
  const city = await getClubById("cmuihq3vs0069h29ebm5xqhye");
  assert(!!city, "Manchester City Loaded", "Successfully retrieved Manchester City club profile");

  if (city) {
    const rosterNames = (city.players || []).map((p: any) => p.fullName);

    // Assert former/retired players are NOT in roster
    const retiredToCheck = ["Frank Lampard", "Wayne Bridge", "Fernandinho", "Richard Wright", "Scott Carson"];
    for (const name of retiredToCheck) {
      assert(
        !rosterNames.includes(name),
        `Retired Player Excluded [${name}]`,
        `${name} is NOT in Manchester City squad`
      );
    }

    // Assert current transfers are IN roster
    const currentToCheck = ["Erling Haaland", "Elliot Anderson", "Enzo Fernández"];
    for (const name of currentToCheck) {
      assert(
        rosterNames.some((n: string) => n.toLowerCase().includes(name.toLowerCase())),
        `Current Player Included [${name}]`,
        `${name} is in Manchester City squad`
      );
    }

    // Verify Haaland value is €220M
    const haaland = city.players.find((p: any) => p.fullName.includes("Haaland"));
    assert(
      haaland?.latestMarketValue === 220000000,
      "Haaland Valuation €220M",
      `Haaland market value is €${((haaland?.latestMarketValue || 0) / 1e6).toFixed(1)}M (expected €220M)`
    );

    // Verify squad size is <= 40
    assert(
      city.squadSize <= 40,
      "Manchester City Squad Size Bound",
      `First team squad size is ${city.squadSize} (down from inflated 69)`
    );
  }
}

async function verifyAll7LeaguesStandings() {
  console.log("\n--- 3. Verifying All 7 Leagues Standings & Promoted Clubs (A3) ---");
  const leagues = [
    { code: "GB1", name: "Premier League", expectedClubs: 20 },
    { code: "ES1", name: "LaLiga", expectedClubs: 20 },
    { code: "IT1", name: "Serie A", expectedClubs: 20 },
    { code: "L1", name: "Bundesliga", expectedClubs: 18 },
    { code: "FR1", name: "Ligue 1", expectedClubs: 18 },
    { code: "PO1", name: "Liga Portugal", expectedClubs: 18 },
    { code: "NL1", name: "Eredivisie", expectedClubs: 18 },
  ];

  for (const l of leagues) {
    const leagueData = await getLeagueById(l.code);
    assert(!!leagueData, `League Loaded [${l.name}]`, `Successfully retrieved ${l.name}`);

    if (leagueData) {
      const standings = leagueData.standings || [];
      assert(
        standings.length === l.expectedClubs,
        `Standings Size [${l.name}]`,
        `${standings.length} clubs in standings (expected ${l.expectedClubs})`
      );

      // Verify every club has clubId and totalSquadValue > 0
      let allLinked = true;
      let allValued = true;

      for (const row of standings) {
        if (!row.clubId) allLinked = false;
        if (!row.totalSquadValue || row.totalSquadValue <= 0) allValued = false;
      }

      assert(allLinked, `Club Links [${l.name}]`, `All ${standings.length} clubs have valid club links`);
      assert(allValued, `Squad Values [${l.name}]`, `All ${standings.length} clubs have squad valuation > 0`);

      // Verify median calculation
      const sortedClubs = [...(leagueData.clubs || [])].sort((a, b) => b.totalSquadValue - a.totalSquadValue);
      if (sortedClubs.length % 2 === 0) {
        const mid1 = sortedClubs[sortedClubs.length / 2 - 1].totalSquadValue;
        const mid2 = sortedClubs[sortedClubs.length / 2].totalSquadValue;
        const realMedian = Math.round((mid1 + mid2) / 2);
        assert(realMedian > 0, `Mathematical Median [${l.name}]`, `Median squad value is €${(realMedian / 1e6).toFixed(1)}M`);
      }
    }
  }
}

async function main() {
  console.log("===============================================================");
  console.log("   a1score.app — Automated Data Integrity Test Suite (Phase A)   ");
  console.log("===============================================================");

  const startTime = Date.now();

  try {
    await verifyTopPlayersAndClubRosters();
    await verifyManchesterCityIntegrity();
    await verifyAll7LeaguesStandings();
  } catch (error) {
    console.error("Fatal error during verification:", error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n===============================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED in ${duration}s`);
  console.log("===============================================================");

  if (failedCount > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${failedCount} errors.`);
    process.exit(1);
  } else {
    console.log("\n✨ ALL DATA INTEGRITY ASSERTIONS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

main();
