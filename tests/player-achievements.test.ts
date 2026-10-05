import test from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";

if (!process.env.CI || process.env.TEST_HONOURS_DB === "true") {
  dotenv.config();
}

import {
  normalizeAchievement,
  normalizeSeasonString,
  parsePlayerAchievementsHtml,
} from "../scripts/ingest-player-achievements";
import {
  getPlayerAchievements,
  isMajorHonour,
} from "../src/lib/data/playerAchievements";
import { PrismaClient } from "@prisma/client";

const hasDbUrl = Boolean((process.env.DATABASE_URL || "").trim());
let prisma: PrismaClient | null = null;

test.before(async () => {
  if (hasDbUrl) {
    try {
      prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      if (prisma) {
        await prisma.$disconnect().catch(() => {});
      }
      prisma = null;
    }
  }
});

test.after(async () => {
  if (prisma) {
    await prisma.$disconnect().catch(() => {});
  }
});

// ----------------------------------------------------
// Test 1: Competition and Award Normalization
// ----------------------------------------------------
test("Competition Normalization: Normalizes major leagues, European cups, and individual accolades", () => {
  // Team Honours
  const ucl = normalizeAchievement("UEFA Champions League winner");
  assert.equal(ucl?.kind, "team_honour");
  assert.equal(ucl?.competitionKey, "ucl");
  assert.equal(ucl?.competitionName, "UEFA Champions League");

  const pl = normalizeAchievement("English Champion");
  assert.equal(pl?.kind, "team_honour");
  assert.equal(pl?.competitionKey, "league_english");
  assert.equal(pl?.competitionName, "English League Title");

  const wc = normalizeAchievement("World Cup winner");
  assert.equal(wc?.kind, "team_honour");
  assert.equal(wc?.competitionKey, "world_cup");
  assert.equal(wc?.competitionName, "FIFA World Cup");

  const euro = normalizeAchievement("European Champion");
  assert.equal(euro?.kind, "team_honour");
  assert.equal(euro?.competitionKey, "european_championship");

  const copa = normalizeAchievement("Copa América winner");
  assert.equal(copa?.kind, "team_honour");
  assert.equal(copa?.competitionKey, "copa_america");

  const faCup = normalizeAchievement("English FA Cup winner");
  assert.equal(faCup?.kind, "team_honour");
  assert.equal(faCup?.competitionKey, "cup_english_fa_cup_winner");

  // Individual Awards
  const ballonDor = normalizeAchievement("Winner Ballon d'Or");
  assert.equal(ballonDor?.kind, "individual_award");
  assert.equal(ballonDor?.competitionKey, "ballon_dor");
  assert.equal(ballonDor?.competitionName, "Ballon d'Or");

  const goldenBoot = normalizeAchievement("Golden Boot winner (Europe)");
  assert.equal(goldenBoot?.kind, "individual_award");
  assert.equal(goldenBoot?.competitionKey, "european_golden_shoe");

  const goldenBoy = normalizeAchievement("Golden Boy");
  assert.equal(goldenBoy?.kind, "individual_award");
  assert.equal(goldenBoy?.competitionKey, "golden_boy");

  const topScorer = normalizeAchievement("Top goal scorer");
  assert.equal(topScorer?.kind, "individual_award");
  assert.equal(topScorer?.competitionKey, "top_goal_scorer");

  const playerOfYear = normalizeAchievement("Footballer of the Year");
  assert.equal(playerOfYear?.kind, "individual_award");
  assert.equal(playerOfYear?.competitionKey, "footballer_of_the_year");
});

// ----------------------------------------------------
// Test 2: Season String Normalization
// ----------------------------------------------------
test("Season String Normalization: Handles 2-digit and 4-digit seasons correctly", () => {
  assert.equal(normalizeSeasonString("23/24"), "2023/24");
  assert.equal(normalizeSeasonString("98/99"), "1998/99");
  assert.equal(normalizeSeasonString("2023"), "2023");
  assert.equal(normalizeSeasonString("1986"), "1986");
  assert.equal(normalizeSeasonString("2020/21"), "2020/21");
});

// ----------------------------------------------------
// Test 3: HTML Parser: Correctly extracts titles, seasons, and clubs
// ----------------------------------------------------
test("HTML Parser: Parses multi-box Transfermarkt HTML structure", () => {
  const mockHtml = `
    <h2 class="content-box-headline">
      1x UEFA Champions League winner
    </h2>
    <div>
      <div class="erfolg_info_box">
        <table class="auflistung">
          <tr>
            <td class="erfolg_table_saison">22/23</td>
            <td class="erfolg_table_wappen">
              <a title="Manchester City" href="/manchester-city/startseite/verein/281/saison_id/2022"><img src="crest.png" /></a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <h2 class="content-box-headline">
      1x Golden Boy
    </h2>
    <div>
      <div class="erfolg_info_box">
        <table class="auflistung">
          <tr>
            <td class="erfolg_table_saison">2020</td>
            <td></td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const parsed = parsePlayerAchievementsHtml(mockHtml);
  assert.equal(parsed.length, 2);

  const ucl = parsed.find((p) => p.competitionKey === "ucl");
  assert.ok(ucl);
  assert.equal(ucl?.kind, "team_honour");
  assert.equal(ucl?.titleCount, 1);
  assert.deepEqual(ucl?.seasons, ["2022/23"]);
  assert.equal(ucl?.clubContext[0]?.clubName, "Manchester City");
  assert.equal(ucl?.clubContext[0]?.clubTmId, "281");

  const gb = parsed.find((p) => p.competitionKey === "golden_boy");
  assert.ok(gb);
  assert.equal(gb?.kind, "individual_award");
  assert.equal(gb?.titleCount, 1);
  assert.deepEqual(gb?.seasons, ["2020"]);
});

// ----------------------------------------------------
// Test 4: Zero Achievements Invariant: Empty HTML returns zero items
// ----------------------------------------------------
test("Zero-Fake Invariant: Players with no honours return 0 rows (never fake 0s)", () => {
  const emptyHtml = `<div class="box"><div class="empty">No trophies found</div></div>`;
  const parsed = parsePlayerAchievementsHtml(emptyHtml);
  assert.equal(parsed.length, 0, "Must return empty array, never fake 0 records");
});

// ----------------------------------------------------
// Test 5: isMajorHonour Classification Logic
// ----------------------------------------------------
test("isMajorHonour: Classifies domestic league and international trophies correctly", () => {
  assert.ok(
    isMajorHonour({
      id: "1",
      playerId: "p1",
      kind: "team_honour",
      competitionKey: "ucl",
      competitionName: "UEFA Champions League",
      titleCount: 1,
      seasons: ["2022/23"],
      clubContext: [],
      source: "Transfermarkt",
      fetchedAt: null,
    })
  );

  assert.ok(
    isMajorHonour({
      id: "2",
      playerId: "p1",
      kind: "team_honour",
      competitionKey: "league_english",
      competitionName: "English League Title",
      titleCount: 2,
      seasons: ["2023/24", "2022/23"],
      clubContext: [],
      source: "Transfermarkt",
      fetchedAt: null,
    })
  );

  // Cup is not a major league/continental trophy
  assert.equal(
    isMajorHonour({
      id: "3",
      playerId: "p1",
      kind: "team_honour",
      competitionKey: "cup_english_fa_cup_winner",
      competitionName: "English FA Cup winner",
      titleCount: 1,
      seasons: ["2023"],
      clubContext: [],
      source: "Transfermarkt",
      fetchedAt: null,
    }),
    false
  );

  // Individual award is never a team honour
  assert.equal(
    isMajorHonour({
      id: "4",
      playerId: "p1",
      kind: "individual_award",
      competitionKey: "ballon_dor",
      competitionName: "Ballon d'Or",
      titleCount: 1,
      seasons: ["2024"],
      clubContext: [],
      source: "Transfermarkt",
      fetchedAt: null,
    }),
    false
  );
});

// ----------------------------------------------------
// Test 6: Database & Data Layer Integration
// ----------------------------------------------------
test("Data Layer: getPlayerAchievements returns structured categories and respects fallback", async (t) => {
  if (!prisma) {
    t.skip("Database not available for integration tests");
    return;
  }

  // 1. Check Haaland (has achievements)
  const haaland = await prisma.player.findFirst({
    where: { fullName: "Erling Haaland" },
    select: { id: true },
  });

  if (haaland) {
    const res = await getPlayerAchievements(haaland.id);
    assert.ok(res.totalTitles > 0, "Haaland must have verified achievements");
    assert.ok(res.majorHonours.length > 0, "Haaland must have major honours (UCL/PL)");
    assert.ok(res.individualAwards.length > 0, "Haaland must have individual awards");

    const uclItem = res.majorHonours.find((h) => h.competitionKey === "ucl");
    assert.ok(uclItem, "Haaland must have UCL trophy");
    assert.ok(uclItem.seasons.includes("2022/23"), "UCL season must include 2022/23");
  }

  // 2. Check Yan Diomande (zero achievements - no fake zeros)
  const diomande = await prisma.player.findFirst({
    where: { fullName: "Yan Diomande" },
    select: { id: true },
  });

  if (diomande) {
    const res = await getPlayerAchievements(diomande.id);
    assert.equal(res.totalTitles, 0, "Player with 0 trophies must return totalTitles: 0");
    assert.equal(res.all.length, 0, "Player with 0 trophies must have empty list");
  }

  // 3. Fallback for non-existent player
  const fallback = await getPlayerAchievements("non-existent-player-id");
  assert.equal(fallback.totalTitles, 0);
  assert.deepEqual(fallback.majorHonours, []);
});
