import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Only attempt database connection when not running in CI, or when TEST_HONOURS_DB=true
if (!process.env.CI || process.env.TEST_HONOURS_DB === "true") {
  dotenv.config();
}
import { PrismaClient } from "@prisma/client";

const hasDbUrl = Boolean((process.env.DATABASE_URL || "").trim());
const prisma = (!process.env.CI || process.env.TEST_HONOURS_DB === "true") && hasDbUrl ? new PrismaClient() : null;

test.before(async () => {
  if (prisma) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
});

test.after(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

test("Validation 1: Exactly 127 winners rows in CSV and database", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/premier-league.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 127, "CSV must contain exactly 127 winners rows");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "premier-league" },
  });
  assert.equal(dbWinners.length, 127, "Database must contain exactly 127 winners rows for premier-league");
});

test("Validation 2: No duplicate seasons in CSV or database", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvSeasons = lines.map(l => l.split(",")[1].trim());
  const uniqueCsvSeasons = new Set(csvSeasons);
  assert.equal(csvSeasons.length, uniqueCsvSeasons.size, "CSV must have no duplicate seasons");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "premier-league" },
    select: { season: true },
  });
  const dbSeasons = dbWinners.map(w => w.season);
  const uniqueDbSeasons = new Set(dbSeasons);
  assert.equal(dbSeasons.length, uniqueDbSeasons.size, "Database must have no duplicate seasons");
});

test("Validation 3: Gaps in consecutive seasons only match season-exceptions.csv", async () => {
  const exceptionsPath = path.resolve(process.cwd(), "data/season-exceptions.csv");
  assert.ok(fs.existsSync(exceptionsPath), "data/season-exceptions.csv exists");

  const exceptionLines = fs.readFileSync(exceptionsPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedExceptions = new Set(exceptionLines.map(l => l.split(",")[1].trim()));

  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const seasonsData = lines.map(l => {
    const parts = l.split(",").map(p => p.trim());
    return { season: parts[1], seasonEndYear: parseInt(parts[2], 10) };
  }).sort((a, b) => a.seasonEndYear - b.seasonEndYear);

  const allSeasons = new Set(seasonsData.map(w => w.season));
  const minYear = seasonsData[0].seasonEndYear; // 1889
  const maxYear = seasonsData[seasonsData.length - 1].seasonEndYear; // 2026

  const actualGaps: string[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    const currYearShort = String(y % 100).padStart(2, "0");
    const startYear = y - 1;
    const seasonStr = `${startYear}/${currYearShort}`;

    if (!allSeasons.has(seasonStr)) {
      actualGaps.push(seasonStr);
    }
  }

  assert.equal(
    actualGaps.length,
    expectedExceptions.size,
    `Gaps count (${actualGaps.length}) must equal expected exceptions (${expectedExceptions.size})`
  );

  for (const gap of actualGaps) {
    assert.ok(
      expectedExceptions.has(gap),
      `Unexpected gap season found: ${gap} is not in season-exceptions.csv`
    );
  }
});

test("Validation 4: Per-club title counts equal data/expected-counts/premier-league.csv", async (t) => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/premier-league.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/premier-league.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
  }

  // Validate CSV counts match expectedMap
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvMap = new Map<string, number>();
  for (const l of lines) {
    const club = l.split(",")[3].trim();
    csvMap.set(club, (csvMap.get(club) || 0) + 1);
  }

  assert.equal(csvMap.size, expectedMap.size, "CSV unique clubs must match expected");
  for (const [clubName, expTitles] of expectedMap.entries()) {
    assert.equal(csvMap.get(clubName), expTitles, `CSV titles mismatch for ${clubName}`);
  }

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "premier-league" },
  });

  const actualMap = new Map<string, number>();
  for (const w of dbWinners) {
    actualMap.set(w.clubName, (actualMap.get(w.clubName) || 0) + 1);
  }

  assert.equal(
    actualMap.size,
    expectedMap.size,
    `Unique winner clubs (${actualMap.size}) must match expected (${expectedMap.size})`
  );

  for (const [clubName, expTitles] of expectedMap.entries()) {
    const actual = actualMap.get(clubName) || 0;
    assert.equal(
      actual,
      expTitles,
      `Titles count mismatch for ${clubName}: expected ${expTitles}, got ${actual}`
    );
  }
});

test("Validation 5: Competitions row exists with key=premier-league and label='English league titles'", async (t) => {
  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const comp = await prisma.competition.findUnique({
    where: { key: "premier-league" },
  });

  assert.ok(comp, "Competition row for premier-league must exist");
  assert.equal(comp?.label, "English league titles", "Competition label must be 'English league titles'");
});

test("Validation 6: Exactly 71 winners rows in Champions League CSV and database", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/champions-league.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/champions-league.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 71, "CSV must contain exactly 71 winners rows");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "champions-league" },
  });
  assert.equal(dbWinners.length, 71, "Database must contain exactly 71 winners rows for champions-league");
});

test("Validation 7: Continuous seasons 1955/56 to 2025/26 for Champions League", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/champions-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const seasonsData = lines.map(l => {
    const parts = l.split(",").map(p => p.trim());
    return { season: parts[1], seasonEndYear: parseInt(parts[2], 10) };
  });

  assert.equal(seasonsData.length, 71, "Must have exactly 71 seasons");
  const seasonSet = new Set(seasonsData.map(w => w.season));

  const missingSeasons: string[] = [];
  for (let y = 1956; y <= 2026; y++) {
    const s = `${y - 1}/${String(y % 100).padStart(2, "0")}`;
    if (!seasonSet.has(s)) {
      missingSeasons.push(s);
    }
  }

  assert.equal(missingSeasons.length, 0, `Continuous seasons check failed. Missing: ${missingSeasons.join(", ")}`);
});

test("Validation 8: Per-club Champions League title counts equal expected-counts/champions-league.csv", async (t) => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/champions-league.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/champions-league.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
  }

  const csvPath = path.resolve(process.cwd(), "data/winners/champions-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvMap = new Map<string, number>();
  for (const l of lines) {
    const club = l.split(",")[3].trim();
    csvMap.set(club, (csvMap.get(club) || 0) + 1);
  }

  assert.equal(csvMap.size, expectedMap.size, "CL CSV unique clubs must match expected");
  for (const [clubName, expTitles] of expectedMap.entries()) {
    assert.equal(csvMap.get(clubName), expTitles, `CL CSV titles mismatch for ${clubName}`);
  }

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "champions-league" },
  });

  const actualMap = new Map<string, number>();
  for (const w of dbWinners) {
    actualMap.set(w.clubName, (actualMap.get(w.clubName) || 0) + 1);
  }

  assert.equal(
    actualMap.size,
    expectedMap.size,
    `Unique winner clubs (${actualMap.size}) must match expected (${expectedMap.size})`
  );

  for (const [clubName, expTitles] of expectedMap.entries()) {
    const actual = actualMap.get(clubName) || 0;
    assert.equal(
      actual,
      expTitles,
      `CL titles count mismatch for ${clubName}: expected ${expTitles}, got ${actual}`
    );
  }
});

test("Validation 9: Competitions row exists with key=champions-league, label='Champions League', and note", async (t) => {
  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const comp = await prisma.competition.findUnique({
    where: { key: "champions-league" },
  });

  assert.ok(comp, "Competition row for champions-league must exist");
  assert.equal(comp?.label, "Champions League", "Competition label must be 'Champions League'");
  assert.equal(comp?.note, "Includes European Cup, 1955/56 to 1991/92", "Competition note must match specification");
});

test("Validation 10: Exactly 95 winners rows in LaLiga CSV and database", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/la-liga.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 95, "CSV must contain exactly 95 winners rows");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "la-liga" },
  });
  assert.equal(dbWinners.length, 95, "Database must contain exactly 95 winners rows for la-liga");
});

test("Validation 11: No duplicate seasons in LaLiga CSV or database", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvSeasons = lines.map(l => l.split(",")[1].trim());
  const uniqueCsvSeasons = new Set(csvSeasons);
  assert.equal(csvSeasons.length, uniqueCsvSeasons.size, "CSV must have no duplicate seasons");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "la-liga" },
    select: { season: true },
  });
  const dbSeasons = dbWinners.map(w => w.season);
  const uniqueDbSeasons = new Set(dbSeasons);
  assert.equal(dbSeasons.length, uniqueDbSeasons.size, "Database must have no duplicate seasons");
});

test("Validation 12: Gaps in consecutive seasons only match season-exceptions-la-liga.csv", async () => {
  const exceptionsPath = path.resolve(process.cwd(), "data/season-exceptions-la-liga.csv");
  assert.ok(fs.existsSync(exceptionsPath), "data/season-exceptions-la-liga.csv exists");

  const exceptionLines = fs.readFileSync(exceptionsPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedExceptions = new Set(exceptionLines.map(l => l.split(",")[1].trim()));

  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const seasonsData = lines.map(l => {
    const parts = l.split(",").map(p => p.trim());
    return { season: parts[1], seasonEndYear: parseInt(parts[2], 10) };
  }).sort((a, b) => a.seasonEndYear - b.seasonEndYear);

  const allSeasons = new Set(seasonsData.map(w => w.season));
  const minYear = seasonsData[0].seasonEndYear; // 1929
  const maxYear = seasonsData[seasonsData.length - 1].seasonEndYear; // 2026

  const actualGaps: string[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    const currYearShort = String(y % 100).padStart(2, "0");
    const startYear = y - 1;
    const seasonStr = `${startYear}/${currYearShort}`;

    if (!allSeasons.has(seasonStr)) {
      actualGaps.push(seasonStr);
    }
  }

  assert.equal(
    actualGaps.length,
    expectedExceptions.size,
    `Gaps count (${actualGaps.length}) must equal expected exceptions (${expectedExceptions.size})`
  );

  for (const gap of actualGaps) {
    assert.ok(
      expectedExceptions.has(gap),
      `Unexpected gap season found: ${gap} is not in season-exceptions-la-liga.csv`
    );
  }
});

test("Validation 13: Per-club title counts equal data/expected-counts/la-liga.csv", async (t) => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/la-liga.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/la-liga.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
  }

  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvMap = new Map<string, number>();
  for (const l of lines) {
    const club = l.split(",")[3].trim();
    csvMap.set(club, (csvMap.get(club) || 0) + 1);
  }

  assert.equal(csvMap.size, expectedMap.size, "LaLiga CSV unique clubs must match expected");
  for (const [clubName, expTitles] of expectedMap.entries()) {
    assert.equal(csvMap.get(clubName), expTitles, `LaLiga CSV titles mismatch for ${clubName}`);
  }

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "la-liga" },
  });

  const actualMap = new Map<string, number>();
  for (const w of dbWinners) {
    actualMap.set(w.clubName, (actualMap.get(w.clubName) || 0) + 1);
  }

  assert.equal(
    actualMap.size,
    expectedMap.size,
    `Unique winner clubs (${actualMap.size}) must match expected (${expectedMap.size})`
  );

  for (const [clubName, expTitles] of expectedMap.entries()) {
    const actual = actualMap.get(clubName) || 0;
    assert.equal(
      actual,
      expTitles,
      `Titles count mismatch for ${clubName}: expected ${expTitles}, got ${actual}`
    );
  }
});

test("Validation 14: Competitions row exists with key=la-liga, label='Spanish league titles', and note", async (t) => {
  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const comp = await prisma.competition.findUnique({
    where: { key: "la-liga" },
  });

  assert.ok(comp, "Competition row for la-liga must exist");
  assert.equal(comp?.label, "Spanish league titles", "Competition label must be 'Spanish league titles'");
  assert.equal(comp?.note, "Includes Atlético Aviación (1939/40, 1940/41)", "Competition note must match specification");
});

test("Validation 15: Exactly 114 winners rows in CSV and database for bundesliga", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/bundesliga.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/bundesliga.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 114, "Bundesliga CSV must contain exactly 114 winners rows");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "bundesliga" },
  });
  assert.equal(dbWinners.length, 114, "Database must contain exactly 114 winners rows for bundesliga");
});

test("Validation 16: No duplicate seasons in CSV or database for bundesliga", async (t) => {
  const csvPath = path.resolve(process.cwd(), "data/winners/bundesliga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvSeasons = lines.map(l => l.split(",")[1].trim());
  const uniqueCsvSeasons = new Set(csvSeasons);
  assert.equal(csvSeasons.length, uniqueCsvSeasons.size, "Bundesliga CSV must have no duplicate seasons");

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "bundesliga" },
    select: { season: true },
  });
  const dbSeasons = dbWinners.map(w => w.season);
  const uniqueDbSeasons = new Set(dbSeasons);
  assert.equal(dbSeasons.length, uniqueDbSeasons.size, "Database must have no duplicate seasons for bundesliga");
});

test("Validation 17: Gaps in consecutive seasons only match season-exceptions-bundesliga.csv", async () => {
  const exceptionsPath = path.resolve(process.cwd(), "data/season-exceptions-bundesliga.csv");
  assert.ok(fs.existsSync(exceptionsPath), "data/season-exceptions-bundesliga.csv exists");

  const exceptionLines = fs.readFileSync(exceptionsPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedExceptions = new Set(exceptionLines.map(l => l.split(",")[1].trim()));

  const csvPath = path.resolve(process.cwd(), "data/winners/bundesliga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const seasonsData = lines.map(l => {
    const parts = l.split(",").map(p => p.trim());
    return { season: parts[1], seasonEndYear: parseInt(parts[2], 10) };
  }).sort((a, b) => a.seasonEndYear - b.seasonEndYear);

  const allSeasons = new Set(seasonsData.map(w => w.season));
  const minYear = seasonsData[0].seasonEndYear; // 1903 (1902/03)
  const maxYear = seasonsData[seasonsData.length - 1].seasonEndYear; // 2026 (2025/26)

  const actualGaps: string[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    const currYearShort = String(y % 100).padStart(2, "0");
    const startYear = y - 1;
    const seasonStr = `${startYear}/${currYearShort}`;

    if (!allSeasons.has(seasonStr)) {
      actualGaps.push(seasonStr);
    }
  }

  assert.equal(
    actualGaps.length,
    expectedExceptions.size,
    `Gaps count (${actualGaps.length}) must equal expected exceptions (${expectedExceptions.size})`
  );

  for (const gap of actualGaps) {
    assert.ok(
      expectedExceptions.has(gap),
      `Unexpected gap season found: ${gap} is not in season-exceptions-bundesliga.csv`
    );
  }
});

test("Validation 18: Per-club title counts equal data/expected-counts/bundesliga.csv", async (t) => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/bundesliga.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/bundesliga.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
  }

  const csvPath = path.resolve(process.cwd(), "data/winners/bundesliga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvMap = new Map<string, number>();
  for (const l of lines) {
    const club = l.split(",")[3].trim();
    csvMap.set(club, (csvMap.get(club) || 0) + 1);
  }

  assert.equal(csvMap.size, expectedMap.size, "Bundesliga CSV unique clubs must match expected");
  for (const [clubName, expTitles] of expectedMap.entries()) {
    assert.equal(csvMap.get(clubName), expTitles, `Bundesliga CSV titles mismatch for ${clubName}`);
  }

  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "bundesliga" },
  });

  const actualMap = new Map<string, number>();
  for (const w of dbWinners) {
    actualMap.set(w.clubName, (actualMap.get(w.clubName) || 0) + 1);
  }

  assert.equal(
    actualMap.size,
    expectedMap.size,
    `Unique winner clubs (${actualMap.size}) must match expected (${expectedMap.size})`
  );

  for (const [clubName, expTitles] of expectedMap.entries()) {
    const actual = actualMap.get(clubName) || 0;
    assert.equal(
      actual,
      expTitles,
      `Titles count mismatch for ${clubName}: expected ${expTitles}, got ${actual}`
    );
  }
});

test("Validation 19: Competitions row exists with key=bundesliga, label='German league titles', and note", async (t) => {
  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const comp = await prisma.competition.findUnique({
    where: { key: "bundesliga" },
  });

  assert.ok(comp, "Competition row for bundesliga must exist");
  assert.equal(comp?.label, "German league titles", "Competition label must be 'German league titles'");
  assert.equal(
    comp?.note,
    "Includes German Championship finals (1903–1963) and Bundesliga (since 1963/64)",
    "Competition note must match specification"
  );
});

// ==========================================
// Phase 11 Tests: Club Honours Pipeline & UI
// ==========================================

import { normalizeSeasonString, parseTransfermarktHonoursHtml } from "../scripts/ingest-honours";
import { getClubHonours } from "../src/lib/data/honours";

test("Phase 11: normalizeSeasonString correctly maps modern, 20th century, and 19th century seasons", () => {
  assert.equal(normalizeSeasonString("23/24"), "2023/24");
  assert.equal(normalizeSeasonString("25/26"), "2025/26");
  assert.equal(normalizeSeasonString("98/99"), "1998/99");
  assert.equal(normalizeSeasonString("80/81"), "1980/81");
  assert.equal(normalizeSeasonString("31/32"), "1931/32");
  assert.equal(normalizeSeasonString("1909/10"), "1909/10");
  assert.equal(normalizeSeasonString("1899/00"), "1899/00");
  assert.equal(normalizeSeasonString("1893/94"), "1893/94");
  assert.equal(normalizeSeasonString("1955"), "1955");
});

test("Phase 11: parseTransfermarktHonoursHtml extracts UCL & domestic league while rejecting lower tiers & cups", () => {
  const sampleHtml = `
    <div class="box">
      <div class="header"><h2>1x European Champion Clubs' Cup winner</h2></div>
      <div class="erfolg_infotext_box">81/82</div>
    </div>
    <div class="box">
      <div class="header"><h2>7x English Champion</h2></div>
      <div class="erfolg_infotext_box">80/81,&nbsp;1909/10,&nbsp;1899/00,&nbsp;1898/99,&nbsp;1896/97,&nbsp;1895/96,&nbsp;1893/94</div>
    </div>
    <div class="box">
      <div class="header"><h2>1x Intertoto Cup Champion</h2></div>
      <div class="erfolg_infotext_box">01/02</div>
    </div>
    <div class="box">
      <div class="header"><h2>2x English 2nd tier champion</h2></div>
      <div class="erfolg_infotext_box">59/60,&nbsp;37/38</div>
    </div>
    <div class="box">
      <div class="header"><h2>1x UEFA Supercup Winner</h2></div>
      <div class="erfolg_infotext_box">82/83</div>
    </div>
  `;

  const parsed = parseTransfermarktHonoursHtml(sampleHtml);
  assert.equal(parsed.length, 2, "Must only match UCL and English Champion (no Intertoto, 2nd tier, or Supercup)");

  const ucl = parsed.find((h) => h.competitionKey === "ucl");
  assert.ok(ucl, "UCL honour must exist");
  assert.equal(ucl.titleCount, 1);
  assert.deepEqual(ucl.seasons, ["1981/82"]);

  const league = parsed.find((h) => h.competitionKey === "domestic_league");
  assert.ok(league, "Domestic league honour must exist");
  assert.equal(league.titleCount, 7);
  assert.equal(league.seasons.length, 7);
  assert.equal(league.seasons[0], "1980/81");
  assert.equal(league.seasons[6], "1893/94");
});

test("Phase 11: parseTransfermarktHonoursHtml returns empty array when no titles exist", () => {
  const emptyHtml = `
    <div class="box">
      <div class="header"><h2>1x English League Cup winner</h2></div>
      <div class="erfolg_infotext_box">20/21</div>
    </div>
    <div class="box">
      <div class="header"><h2>1x Italian Serie B champion</h2></div>
      <div class="erfolg_infotext_box">14/15</div>
    </div>
  `;

  const parsed = parseTransfermarktHonoursHtml(emptyHtml);
  assert.equal(parsed.length, 0, "Must return empty array and never create 0-title entries");
});

test("Phase 11: getClubHonours handles empty/invalid club ID safely without throwing", async () => {
  const honoursEmpty = await getClubHonours("");
  assert.deepEqual(honoursEmpty, []);

  const honoursInvalid = await getClubHonours("non-existent-club-id-99999");
  assert.deepEqual(honoursInvalid, []);
});

test("Phase 11: Database contains ingested honours for top European clubs", async (t) => {
  if (!prisma) {
    t.skip("DATABASE_URL not configured. Skipping database check.");
    return;
  }

  const realMadridHonours = await prisma.clubHonour.findMany({
    where: { club: { name: { contains: "Real Madrid" } } },
  });

  if (realMadridHonours.length > 0) {
    const ucl = realMadridHonours.find((h) => h.competitionKey === "ucl");
    assert.ok(ucl, "Real Madrid must have UCL honours");
    assert.equal(ucl.titleCount, 15, "Real Madrid must have 15 UCL titles");

    const league = realMadridHonours.find((h) => h.competitionKey === "domestic_league");
    assert.ok(league, "Real Madrid must have Spanish League honours");
    assert.equal(league.titleCount, 36, "Real Madrid must have 36 Spanish League titles");
  }
});

