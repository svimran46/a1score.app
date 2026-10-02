import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.after(async () => {
  await prisma.$disconnect();
});

test("Validation 1: Exactly 127 winners rows in CSV and database", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/premier-league.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 127, "CSV must contain exactly 127 winners rows");

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "premier-league" },
  });
  assert.equal(dbWinners.length, 127, "Database must contain exactly 127 winners rows for premier-league");
});

test("Validation 2: No duplicate seasons in CSV or database", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvSeasons = lines.map(l => l.split(",")[1].trim());
  const uniqueCsvSeasons = new Set(csvSeasons);
  assert.equal(csvSeasons.length, uniqueCsvSeasons.size, "CSV must have no duplicate seasons");

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

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "premier-league" },
    select: { season: true, seasonEndYear: true },
    orderBy: { seasonEndYear: "asc" },
  });

  const allSeasons = new Set(dbWinners.map(w => w.season));

  const minYear = dbWinners[0].seasonEndYear; // 1889
  const maxYear = dbWinners[dbWinners.length - 1].seasonEndYear; // 2026

  const actualGaps: string[] = [];

  for (let y = minYear; y <= maxYear; y++) {
    const prevYearShort = String((y - 1) % 100).padStart(2, "0");
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

test("Validation 4: Per-club title counts equal data/expected-counts/premier-league.csv", async () => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/premier-league.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/premier-league.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
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

test("Validation 5: Competitions row exists with key=premier-league and label='English league titles'", async () => {
  const comp = await prisma.competition.findUnique({
    where: { key: "premier-league" },
  });

  assert.ok(comp, "Competition row for premier-league must exist");
  assert.equal(comp?.label, "English league titles", "Competition label must be 'English league titles'");
});

test("Validation 6: Exactly 71 winners rows in Champions League CSV and database", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/champions-league.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/champions-league.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 71, "CSV must contain exactly 71 winners rows");

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "champions-league" },
  });
  assert.equal(dbWinners.length, 71, "Database must contain exactly 71 winners rows for champions-league");
});

test("Validation 7: Continuous seasons 1955/56 to 2025/26 for Champions League", async () => {
  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "champions-league" },
    select: { season: true, seasonEndYear: true },
    orderBy: { seasonEndYear: "asc" },
  });

  assert.equal(dbWinners.length, 71, "Must have exactly 71 seasons");
  const seasonSet = new Set(dbWinners.map(w => w.season));

  const missingSeasons: string[] = [];
  for (let y = 1956; y <= 2026; y++) {
    const s = `${y - 1}/${String(y % 100).padStart(2, "0")}`;
    if (!seasonSet.has(s)) {
      missingSeasons.push(s);
    }
  }

  assert.equal(missingSeasons.length, 0, `Continuous seasons check failed. Missing: ${missingSeasons.join(", ")}`);
});

test("Validation 8: Per-club Champions League title counts equal expected-counts/champions-league.csv", async () => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/champions-league.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/champions-league.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
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

test("Validation 9: Competitions row exists with key=champions-league, label='Champions League', and note", async () => {
  const comp = await prisma.competition.findUnique({
    where: { key: "champions-league" },
  });

  assert.ok(comp, "Competition row for champions-league must exist");
  assert.equal(comp?.label, "Champions League", "Competition label must be 'Champions League'");
  assert.equal(comp?.note, "Includes European Cup, 1955/56 to 1991/92", "Competition note must match specification");
});

test("Validation 10: Exactly 95 winners rows in LaLiga CSV and database", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  assert.ok(fs.existsSync(csvPath), "data/winners/la-liga.csv exists");

  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  assert.equal(lines.length, 95, "CSV must contain exactly 95 winners rows");

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "la-liga" },
  });
  assert.equal(dbWinners.length, 95, "Database must contain exactly 95 winners rows for la-liga");
});

test("Validation 11: No duplicate seasons in LaLiga CSV or database", async () => {
  const csvPath = path.resolve(process.cwd(), "data/winners/la-liga.csv");
  const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const csvSeasons = lines.map(l => l.split(",")[1].trim());
  const uniqueCsvSeasons = new Set(csvSeasons);
  assert.equal(csvSeasons.length, uniqueCsvSeasons.size, "CSV must have no duplicate seasons");

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

  const dbWinners = await prisma.competitionWinner.findMany({
    where: { competitionKey: "la-liga" },
    select: { season: true, seasonEndYear: true },
    orderBy: { seasonEndYear: "asc" },
  });

  const allSeasons = new Set(dbWinners.map(w => w.season));

  const minYear = dbWinners[0].seasonEndYear; // 1929
  const maxYear = dbWinners[dbWinners.length - 1].seasonEndYear; // 2026

  const actualGaps: string[] = [];

  for (let y = minYear; y <= maxYear; y++) {
    const prevYearShort = String((y - 1) % 100).padStart(2, "0");
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

test("Validation 13: Per-club title counts equal data/expected-counts/la-liga.csv", async () => {
  const expectedPath = path.resolve(process.cwd(), "data/expected-counts/la-liga.csv");
  assert.ok(fs.existsSync(expectedPath), "data/expected-counts/la-liga.csv exists");

  const expectedLines = fs.readFileSync(expectedPath, "utf-8").trim().split("\n").slice(1).filter(l => l.trim().length > 0);
  const expectedMap = new Map<string, number>();
  for (const line of expectedLines) {
    const parts = line.split(",").map(p => p.trim());
    expectedMap.set(parts[1], parseInt(parts[2], 10));
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

test("Validation 14: Competitions row exists with key=la-liga, label='Spanish league titles', and note", async () => {
  const comp = await prisma.competition.findUnique({
    where: { key: "la-liga" },
  });

  assert.ok(comp, "Competition row for la-liga must exist");
  assert.equal(comp?.label, "Spanish league titles", "Competition label must be 'Spanish league titles'");
  assert.equal(comp?.note, "Includes Atlético Aviación (1939/40, 1940/41)", "Competition note must match specification");
});


