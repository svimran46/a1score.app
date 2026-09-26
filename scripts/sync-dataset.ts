/**
 * scripts/sync-dataset.ts
 *
 * High-Performance Tier 1 Data Pipeline for a1score.app
 * Downloads and syncs CC0 curated data from transfermarkt-datasets (dcaribou)
 * using batching, in-memory lookups, and createMany for fast ingestion.
 */

import fs from "fs";
import path from "path";
import https from "https";
import zlib from "zlib";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const R2_BASE_URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data";
const DATA_DIR = path.join(process.cwd(), "data");

// Target competitions to prioritize (Top European Leagues & Continental)
const TRACKED_COMPETITIONS = new Set([
  "GB1", // Premier League
  "ES1", // La Liga
  "IT1", // Serie A
  "L1",  // Bundesliga
  "FR1", // Ligue 1
  "NL1", // Eredivisie
  "PO1", // Liga Portugal
  "CL",  // UEFA Champions League
]);

// Helper for concurrency
async function pMap<T>(items: T[], fn: (item: T) => Promise<any>, concurrency = 25) {
  const results: any[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function downloadFile(fileName: string): Promise<string> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const destPath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(destPath)) {
    console.log(`[Cache Hit] ${fileName} already exists.`);
    return destPath;
  }

  const url = `${R2_BASE_URL}/${fileName}.gz`;
  console.log(`[Downloading] ${url} -> ${destPath}`);

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
          return;
        }

        const gunzip = zlib.createGunzip();
        const fileStream = fs.createWriteStream(destPath);

        res
          .pipe(gunzip)
          .pipe(fileStream)
          .on("finish", () => {
            console.log(`[Success] Extracted ${fileName}`);
            resolve(destPath);
          })
          .on("error", reject);
      })
      .on("error", reject);
  });
}

async function parseCsv(filePath: string): Promise<any[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  return new Promise((resolve, reject) => {
    parse(
      content,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      (err, records) => {
        if (err) reject(err);
        else resolve(records);
      }
    );
  });
}

async function syncCompetitions(filePath: string) {
  console.log("\n--- Syncing Competitions / Leagues ---");
  const records = await parseCsv(filePath);
  const tracked = records.filter((r) => TRACKED_COMPETITIONS.has(r.competition_id));

  for (const r of tracked) {
    await prisma.league.upsert({
      where: { transfermarktId: r.competition_id },
      update: {
        name: r.name,
        country: r.country_name || "Unknown",
        tier: r.sub_type?.includes("first_tier") ? 1 : 2,
      },
      create: {
        transfermarktId: r.competition_id,
        name: r.name,
        country: r.country_name || "Unknown",
        tier: r.sub_type?.includes("first_tier") ? 1 : 2,
      },
    });
  }
  console.log(`Synced ${tracked.length} leagues.`);
}

async function syncClubs(filePath: string) {
  console.log("\n--- Syncing Clubs ---");
  const records = await parseCsv(filePath);
  const tracked = records.filter((r) => TRACKED_COMPETITIONS.has(r.domestic_competition_id));

  // In-memory league lookup
  const leagues = await prisma.league.findMany();
  const leagueMap = new Map(leagues.map((l) => [l.transfermarktId, l.id]));

  console.log(`Upserting ${tracked.length} clubs in parallel...`);
  await pMap(
    tracked,
    async (r) => {
      const leagueId = leagueMap.get(r.domestic_competition_id) ?? null;
      await prisma.club.upsert({
        where: { transfermarktId: String(r.club_id) },
        update: {
          name: r.name,
          code: r.club_code || null,
          leagueId,
        },
        create: {
          transfermarktId: String(r.club_id),
          name: r.name,
          code: r.club_code || null,
          leagueId,
        },
      });
    },
    20
  );

  console.log(`Synced ${tracked.length} clubs.`);
}

async function syncPlayers(filePath: string) {
  console.log("\n--- Syncing Players ---");
  const records = await parseCsv(filePath);
  const tracked = records.filter((r) =>
    TRACKED_COMPETITIONS.has(r.current_club_domestic_competition_id)
  );

  console.log(`Found ${tracked.length} tracked players.`);
  const clubs = await prisma.club.findMany({ select: { id: true, transfermarktId: true } });
  const clubMap = new Map(clubs.map((c) => [c.transfermarktId, c.id]));

  const playerRows: any[] = [];
  for (const r of tracked) {
    const clubId = clubMap.get(String(r.current_club_id)) ?? null;
    const dob = r.date_of_birth ? new Date(r.date_of_birth) : null;
    const height = r.height_in_cm ? parseInt(r.height_in_cm, 10) : null;
    const nationalities = r.country_of_citizenship ? [r.country_of_citizenship] : [];

    playerRows.push({
      transfermarktId: String(r.player_id),
      fullName: r.name,
      position: r.position || "Unknown",
      subPosition: r.sub_position || null,
      dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : null,
      nationality: nationalities,
      heightCm: height && !isNaN(height) ? height : null,
      photoUrl: r.image_url || null,
      currentClubId: clubId,
    });
  }

  // Insert in chunks of 1000
  const chunkSize = 1000;
  for (let i = 0; i < playerRows.length; i += chunkSize) {
    const chunk = playerRows.slice(i, i + chunkSize);
    await prisma.player.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Ingested ${Math.min(i + chunkSize, playerRows.length)}/${playerRows.length} players...`);
  }

  console.log(`Finished syncing ${playerRows.length} players.`);
}

async function syncValuations(filePath: string) {
  console.log("\n--- Syncing Market Value History ---");
  const records = await parseCsv(filePath);

  const players = await prisma.player.findMany({
    select: { id: true, transfermarktId: true },
  });
  const playerMap = new Map(players.map((p) => [p.transfermarktId, p.id]));

  const relevant = records.filter(
    (r) => playerMap.has(String(r.player_id)) && r.market_value_in_eur
  );

  console.log(`Preparing ${relevant.length} valuation entries...`);
  
  // Clear old valuations to keep clean state
  await prisma.marketValueHistory.deleteMany();

  const dataRows: any[] = [];
  for (const r of relevant) {
    const pId = playerMap.get(String(r.player_id));
    if (!pId) continue;
    const date = new Date(r.date);
    if (isNaN(date.getTime())) continue;

    dataRows.push({
      playerId: pId,
      date,
      valueEur: BigInt(Math.round(parseFloat(r.market_value_in_eur))),
      clubName: r.current_club_name || null,
    });
  }

  // Batch insert with createMany (chunks of 1000)
  const chunkSize = 1000;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    await prisma.marketValueHistory.createMany({ data: chunk });
    if ((i + chunkSize) % 5000 === 0 || i + chunkSize >= dataRows.length) {
      console.log(`Inserted ${Math.min(i + chunkSize, dataRows.length)}/${dataRows.length} valuations...`);
    }
  }

  console.log(`Finished syncing ${dataRows.length} valuations.`);
}

async function syncTransfers(filePath: string) {
  console.log("\n--- Syncing Transfers ---");
  const records = await parseCsv(filePath);
  const players = await prisma.player.findMany({
    select: { id: true, transfermarktId: true },
  });
  const playerMap = new Map(players.map((p) => [p.transfermarktId, p.id]));

  const relevant = records.filter((r) => playerMap.has(String(r.player_id)));
  console.log(`Preparing ${relevant.length} transfer records...`);

  await prisma.transfer.deleteMany();

  const dataRows: any[] = [];
  for (const r of relevant) {
    const pId = playerMap.get(String(r.player_id));
    if (!pId) continue;
    const date = new Date(r.transfer_date);
    if (isNaN(date.getTime())) continue;

    const fee = r.transfer_fee ? BigInt(Math.round(parseFloat(r.transfer_fee))) : null;

    dataRows.push({
      playerId: pId,
      date,
      fromClubName: r.from_club_name || null,
      toClubName: r.to_club_name || null,
      feeEur: fee,
    });
  }

  // Batch insert with createMany (chunks of 1000)
  const chunkSize = 1000;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    await prisma.transfer.createMany({ data: chunk });
    if ((i + chunkSize) % 5000 === 0 || i + chunkSize >= dataRows.length) {
      console.log(`Inserted ${Math.min(i + chunkSize, dataRows.length)}/${dataRows.length} transfers...`);
    }
  }

  console.log(`Finished syncing ${dataRows.length} transfers.`);
}

async function main() {
  console.log("=== a1score.app High-Performance Data Pipeline Sync ===");
  try {
    const compFile = await downloadFile("competitions.csv");
    const clubsFile = await downloadFile("clubs.csv");
    const playersFile = await downloadFile("players.csv");
    const valFile = await downloadFile("player_valuations.csv");
    const transfersFile = await downloadFile("transfers.csv");

    await syncCompetitions(compFile);
    await syncClubs(clubsFile);
    await syncPlayers(playersFile);
    await syncValuations(valFile);
    await syncTransfers(transfersFile);

    console.log("\n✅ [Pipeline Complete] a1score.app database is fully populated with real data!");
  } catch (error) {
    console.error("Pipeline failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
