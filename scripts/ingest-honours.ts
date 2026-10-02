/**
 * scripts/ingest-honours.ts
 *
 * Ingestion pipeline for Club Honours (achievements) from Transfermarkt.
 * Focuses on:
 * 1. Domestic First-Tier League Titles ("domestic_league")
 * 2. UEFA Champions League / European Cup ("ucl")
 *
 * Features:
 * - Polite rate limiting (1.2 - 1.5s per club request)
 * - Descriptive User-Agent
 * - Resumable: skips clubs fetched in the last 30 days
 * - Retries with exponential backoff
 * - Never invents honours (no fake 0-title rows)
 * - Extensible: designed so additional competitions can be added without schema rewrites
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 a1score/1.0 (Club Honours Ingestion Pipeline)",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

export interface ParsedHonour {
  competitionKey: "domestic_league" | "ucl";
  competitionName: string;
  titleCount: number;
  seasons: string[];
}

/**
 * Normalizes season strings: e.g. "23/24" -> "2023/24", "98/99" -> "1998/99", "1936/37" -> "1936/37".
 */
export function normalizeSeasonString(raw: string): string {
  const clean = raw.trim().replace(/^['"]|['"]$/g, "");
  const slashMatch = clean.match(/^(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    const y1 = parseInt(slashMatch[1], 10);
    const y2 = parseInt(slashMatch[2], 10);
    const prefix1 = y1 <= 26 ? "20" : "19";
    const prefix2 = y2 <= 26 ? "20" : "19";
    return `${prefix1}${slashMatch[1]}/${slashMatch[2]}`;
  }

  // Already 4-digit start year e.g. 1998/99 or 2021/22
  const fullSlashMatch = clean.match(/^(\d{4})\/(\d{2,4})$/);
  if (fullSlashMatch) {
    return clean;
  }

  // Single 4-digit calendar year e.g. 1955
  const yearMatch = clean.match(/^\d{4}$/);
  if (yearMatch) {
    return clean;
  }

  return clean;
}

/**
 * Parses Transfermarkt HTML from the club erfolge page into normalized honours.
 */
export function parseTransfermarktHonoursHtml(html: string): ParsedHonour[] {
  const honoursMap = new Map<string, {
    key: "domestic_league" | "ucl";
    name: string;
    count: number;
    seasons: Set<string>;
  }>();

  // Find all trophy blocks: <h2 ...>(\d+)x (Trophy Name)</h2> followed by erfolg_infotext_box
  // Pattern matches the h2 and the subsequent text block before the next section
  const sectionRegex = /<h2[^>]*>\s*(\d+)x\s+([^<]+)<\/h2>([\s\S]*?)(?=<h2|<div class="box|<table|id="footer"|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(html)) !== null) {
    const count = parseInt(match[1], 10);
    const rawTrophy = match[2].trim();
    const content = match[3];

    // Extract seasons from erfolg_infotext_box
    const seasons: string[] = [];
    const infoBoxMatch = content.match(/<div[^>]*class="[^"]*erfolg_infotext_box[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (infoBoxMatch) {
      const rawText = infoBoxMatch[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
      const seasonTokens = rawText.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      for (const token of seasonTokens) {
        const seasonPart = token.match(/\b\d{2,4}\/\d{2,4}\b|\b\d{4}\b/);
        if (seasonPart) {
          seasons.push(normalizeSeasonString(seasonPart[0]));
        }
      }
    }

    // 1. Check UEFA Champions League / European Champion Clubs' Cup
    if (
      /Champions\s*League|European\s*Champion\s*Clubs'?\s*Cup|European\s*Cup/i.test(rawTrophy) &&
      !/Super\s*Cup|Youth|Conference|Europa/i.test(rawTrophy)
    ) {
      const existing = honoursMap.get("ucl") || {
        key: "ucl" as const,
        name: "UEFA Champions League",
        count: 0,
        seasons: new Set<string>(),
      };
      existing.count += count;
      seasons.forEach((s) => existing.seasons.add(s));
      honoursMap.set("ucl", existing);
      continue;
    }

    // 2. Check Domestic Top-Flight Champion
    // Matches "English Champion", "Spanish Champion", "German Champion", "Italian Champion", etc.
    // Excludes lower divisions (e.g. Serie B, 2. Bundesliga, 4th Division, Segunda), tiers, cups, youth, and reserve championships
    const lowerTierOrCupRegex =
      /serie|bundesliga\s*[2-3]|2\.\s*bundesliga|3\.\s*bundesliga|tier|division|amateur|youth|reserve|regional|promoted|play-off|autumn|spring|2nd|3rd|4th|5th|second|third|fourth|fifth|b-team|u\d+|intertoto|cup|supercup|super\s*cup|league\s*cup|segunda/i;

    const isDomesticChampion =
      /(.+)\s+Champion$/i.test(rawTrophy) &&
      !lowerTierOrCupRegex.test(rawTrophy);

    if (isDomesticChampion) {
      const champMatch = rawTrophy.match(/(.+)\s+Champion$/i);
      const leagueName = champMatch ? `${champMatch[1].trim()} League Titles` : "Domestic League Titles";

      const existing = honoursMap.get("domestic_league") || {
        key: "domestic_league" as const,
        name: leagueName,
        count: 0,
        seasons: new Set<string>(),
      };
      existing.count += count;
      seasons.forEach((s) => existing.seasons.add(s));
      honoursMap.set("domestic_league", existing);
      continue;
    }
  }

  // Convert map to array and sort seasons descending
  return Array.from(honoursMap.values()).map((h) => ({
    competitionKey: h.key,
    competitionName: h.name,
    titleCount: Math.max(h.count, h.seasons.size),
    seasons: Array.from(h.seasons).sort((a, b) => {
      const numA = parseInt(a.slice(0, 4), 10) || 0;
      const numB = parseInt(b.slice(0, 4), 10) || 0;
      return numB - numA;
    }),
  }));
}

/**
 * Fetch Transfermarkt erfolge HTML with rate limiting and exponential backoff.
 */
async function fetchClubErfolgeHtml(tmId: string, clubName: string): Promise<string | null> {
  const slug = clubName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const url = `https://www.transfermarkt.com/${slug}/erfolge/verein/${tmId}`;

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: TM_HEADERS });
      if (res.status === 200) {
        return await res.text();
      }
      if (res.status === 404) {
        console.warn(`[Ingest Honours] Club ${clubName} (${tmId}) returned 404 on Transfermarkt.`);
        return null;
      }
      if (res.status === 429) {
        const delay = 3000 * Math.pow(2, attempt);
        console.warn(`[Ingest Honours] Rate limited (429) on ${clubName}. Waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      console.error(`[Ingest Honours] Network error for ${clubName} (${tmId}):`, err.message);
      return null;
    }
  }
  return null;
}

export async function runIngestion(options: {
  limit?: number;
  clubId?: string;
  force?: boolean;
} = {}) {
  console.log("=================================================");
  console.log("🏆 a1score.app — Club Honours Ingestion Pipeline");
  console.log("=================================================");

  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch clubs from DB
  const clubs = await prisma.club.findMany({
    where: {
      transfermarktId: { not: null },
      ...(options.clubId ? { id: options.clubId } : {}),
    },
    select: {
      id: true,
      name: true,
      transfermarktId: true,
      country: true,
    },
    orderBy: [
      { totalMarketValue: { sort: "desc", nulls: "last" } },
      { name: "asc" },
    ],
  });

  console.log(`Found ${clubs.length} total clubs in database.`);

  // 2. Fetch existing honours timestamps for resumability
  const existingHonours = await prisma.clubHonour.findMany({
    select: { clubId: true, fetchedAt: true },
  });

  const recentlyFetchedClubs = new Set<string>();
  if (!options.force) {
    for (const h of existingHonours) {
      if (h.fetchedAt && h.fetchedAt > THIRTY_DAYS_AGO) {
        recentlyFetchedClubs.add(h.clubId);
      }
    }
  }

  const clubsToProcess = clubs.filter((c) => options.force || !recentlyFetchedClubs.has(c.id));
  const targetList = options.limit ? clubsToProcess.slice(0, options.limit) : clubsToProcess;

  console.log(`Skipping ${clubs.length - clubsToProcess.length} clubs fetched in the last 30 days.`);
  console.log(`Ingesting honours for ${targetList.length} clubs...\n`);

  let clubsWithHonours = 0;
  let clubsWithoutHonours = 0;
  let failedClubs: Array<{ name: string; id: string; reason: string }> = [];

  for (let i = 0; i < targetList.length; i++) {
    const club = targetList[i];
    const tmId = club.transfermarktId!;
    console.log(`[${i + 1}/${targetList.length}] Processing ${club.name} (TM ID: ${tmId})...`);

    // Polite rate limiting: 1.2s between requests
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1200));
    }

    const html = await fetchClubErfolgeHtml(tmId, club.name);
    if (!html) {
      failedClubs.push({ name: club.name, id: club.id, reason: "Fetch failed or 404" });
      continue;
    }

    const parsed = parseTransfermarktHonoursHtml(html);

    if (parsed.length === 0) {
      clubsWithoutHonours++;
      console.log(`  -> 0 top-flight titles found. Storing nothing (no fake data).`);
      continue;
    }

    clubsWithHonours++;
    for (const h of parsed) {
      console.log(`  -> ${h.titleCount}x ${h.competitionName} (${h.seasons.length} seasons recorded)`);

      await prisma.clubHonour.upsert({
        where: {
          clubId_competitionKey: {
            clubId: club.id,
            competitionKey: h.competitionKey,
          },
        },
        update: {
          competitionName: h.competitionName,
          titleCount: h.titleCount,
          seasons: h.seasons,
          source: "Transfermarkt",
          fetchedAt: new Date(),
        },
        create: {
          clubId: club.id,
          competitionKey: h.competitionKey,
          competitionName: h.competitionName,
          titleCount: h.titleCount,
          seasons: h.seasons,
          source: "Transfermarkt",
          fetchedAt: new Date(),
        },
      });
    }
  }

  console.log("\n=================================================");
  console.log("🏁 Ingestion Run Complete!");
  console.log(`Total clubs processed: ${targetList.length}`);
  console.log(`Clubs with honours: ${clubsWithHonours}`);
  console.log(`Clubs with 0 titles (no rows created): ${clubsWithoutHonours}`);
  console.log(`Clubs failed: ${failedClubs.length}`);
  if (failedClubs.length > 0) {
    console.log("Failed clubs details:", failedClubs);
  }
  console.log("=================================================\n");

  return {
    processed: targetList.length,
    clubsWithHonours,
    clubsWithoutHonours,
    failedClubs,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const force = args.includes("--force");

  runIngestion({ limit, force })
    .catch((err) => {
      console.error("Fatal ingestion error:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
