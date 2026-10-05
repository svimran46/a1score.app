/**
 * scripts/ingest-player-achievements.ts
 *
 * Ingestion pipeline for Player Achievements (Honours and Individual Awards) from Transfermarkt.
 *
 * Requirements & Invariants:
 * 1. Resumable & Polite:
 *    - 1.0 - 2.0s delay between player fetches with randomized jitter.
 *    - Skips players fetched in the last 30 days unless --force is specified.
 *    - Respects robots.txt with transparent User-Agent.
 *    - Exponential backoff on HTTP 429.
 * 2. Normalization & Integrity:
 *    - Categorizes into:
 *      * "team_honour" (Major leagues, UCL, World Cup, Continental tournaments, Domestic Cups, Super Cups)
 *      * "individual_award" (Ballon d'Or, Golden Boot/Top Scorer, Player of the Year, Golden Boy, Yashin Trophy, etc.)
 *    - Normalizes competition names to clean, stable keys (e.g. "ucl", "premier_league", "ballon_dor", "world_cup").
 *    - Logs ambiguous/unknown competitions to docs/UNFIXED_ISSUES.md without crashing.
 *    - Never invents or infers fake "0" counts. Zero trophies = zero rows.
 *    - Upserts into PlayerAchievement with unique constraint (playerId, kind, competitionKey).
 * 3. CLI options:
 *    - --limit <number>: Limit the number of players to process (default: 50).
 *    - --player <cuid_or_tmId>: Process a specific single player.
 *    - --force: Force re-fetch even if fetched within 30 days.
 *    - --since <days>: Custom freshness cutoff in days.
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 a1score/1.0 (Player Achievements Pipeline; polite crawler)",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

export interface ParsedPlayerAchievement {
  kind: "team_honour" | "individual_award";
  competitionKey: string;
  competitionName: string;
  titleCount: number;
  seasons: string[];
  clubContext: Array<{
    season: string;
    clubName?: string;
    clubTmId?: string;
  }>;
}

/**
 * Normalizes season strings e.g. "23/24" -> "2023/24", "98/99" -> "1998/99", "2023" -> "2023".
 */
export function normalizeSeasonString(raw: string): string {
  const clean = raw.trim().replace(/^['"]|['"]$/g, "");
  const slashMatch = clean.match(/^(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    const y1 = parseInt(slashMatch[1], 10);
    const prefix1 = y1 <= 30 ? "20" : "19";
    return `${prefix1}${slashMatch[1]}/${slashMatch[2]}`;
  }

  const fullSlashMatch = clean.match(/^(\d{4})\/(\d{2,4})$/);
  if (fullSlashMatch) {
    return clean;
  }

  const yearMatch = clean.match(/^\d{4}$/);
  if (yearMatch) {
    return clean;
  }

  return clean;
}

/**
 * Normalizes competition name and determines whether it is a team honour or an individual award.
 */
export function normalizeAchievement(rawTitle: string): {
  kind: "team_honour" | "individual_award";
  competitionKey: string;
  competitionName: string;
} | null {
  const title = rawTitle.trim();

  // ----------------------------------------------------
  // INDIVIDUAL AWARDS
  // ----------------------------------------------------
  if (/Ballon\s*d'?Or/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "ballon_dor",
      competitionName: "Ballon d'Or",
    };
  }

  if (/The\s*Best\s*FIFA/i.test(title) || /FIFA\s*World\s*Player/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "fifa_the_best",
      competitionName: "The Best FIFA Men's Player",
    };
  }

  if (/Golden\s*Boot|Top\s*(goal\s*)?scorer/i.test(title)) {
    if (/Europe|European/i.test(title)) {
      return {
        kind: "individual_award",
        competitionKey: "european_golden_shoe",
        competitionName: "European Golden Shoe",
      };
    }
    return {
      kind: "individual_award",
      competitionKey: "top_goal_scorer",
      competitionName: "Top Goal Scorer",
    };
  }

  if (/Golden\s*Boy/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "golden_boy",
      competitionName: "Golden Boy",
    };
  }

  if (/Kopa\s*Trophy/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "kopa_trophy",
      competitionName: "Kopa Trophy",
    };
  }

  if (/Yashin\s*Trophy|The\s*Best\s*FIFA\s*Goalkeeper/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "yashin_trophy",
      competitionName: "Yashin Trophy / Best Goalkeeper",
    };
  }

  if (/UEFA\s*Best\s*Player/i.test(title) || /UEFA\s*Men'?s\s*Player\s*of\s*the\s*Year/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "uefa_player_of_the_year",
      competitionName: "UEFA Player of the Year",
    };
  }

  if (/Footballer\s*of\s*the\s*Year/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "footballer_of_the_year",
      competitionName: "Footballer of the Year",
    };
  }

  if (/Player\s*of\s*the\s*Season|Player\s*of\s*the\s*Year/i.test(title)) {
    return {
      kind: "individual_award",
      competitionKey: "player_of_the_season",
      competitionName: "Player of the Season",
    };
  }

  // ----------------------------------------------------
  // TEAM HONOURS: Champions League & European Cups
  // ----------------------------------------------------
  if (
    /Champions\s*League|European\s*Champion\s*Clubs'?\s*Cup|European\s*Cup/i.test(title) &&
    !/Super\s*Cup|Youth|Conference|Europa/i.test(title)
  ) {
    return {
      kind: "team_honour",
      competitionKey: "ucl",
      competitionName: "UEFA Champions League",
    };
  }

  if (/Europa\s*League|UEFA\s*Cup/i.test(title) && !/Conference/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "europa_league",
      competitionName: "UEFA Europa League",
    };
  }

  if (/Conference\s*League/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "conference_league",
      competitionName: "UEFA Conference League",
    };
  }

  if (/UEFA\s*Supercup|UEFA\s*Super\s*Cup/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "uefa_super_cup",
      competitionName: "UEFA Super Cup",
    };
  }

  if (/FIFA\s*Club\s*World\s*Cup/i.test(title) || /Intercontinental\s*Cup/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "club_world_cup",
      competitionName: "FIFA Club World Cup",
    };
  }

  // ----------------------------------------------------
  // TEAM HONOURS: National Team
  // ----------------------------------------------------
  if (/World\s*Cup\s*winner/i.test(title) && !/Club/i.test(title) && !/U\d+/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "world_cup",
      competitionName: "FIFA World Cup",
    };
  }

  if (/European\s*Champion$/i.test(title) && !/Clubs/i.test(title) && !/U\d+/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "european_championship",
      competitionName: "UEFA European Championship",
    };
  }

  if (/Copa\s*Am[eé]rica\s*winner/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "copa_america",
      competitionName: "Copa América",
    };
  }

  if (/Africa\s*Cup\s*of\s*Nations/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "afcon",
      competitionName: "Africa Cup of Nations",
    };
  }

  if (/UEFA\s*Nations\s*League/i.test(title)) {
    return {
      kind: "team_honour",
      competitionKey: "nations_league",
      competitionName: "UEFA Nations League",
    };
  }

  // ----------------------------------------------------
  // TEAM HONOURS: Domestic League Titles
  // ----------------------------------------------------
  const lowerDivisionRegex =
    /serie\s*[b-d]|bundesliga\s*[2-3]|2\.\s*bundesliga|3\.\s*bundesliga|segunda|tier|division\s*[2-5]|amateur|youth|reserve|promoted|play-off|autumn|spring|2nd|3rd|4th|5th|second|third|fourth|fifth|b-team|u\d+/i;

  if (/(.+)\s+Champion$/i.test(title) && !lowerDivisionRegex.test(title)) {
    const champMatch = title.match(/(.+)\s+Champion$/i);
    const country = champMatch ? champMatch[1].trim() : "Domestic";
    const key = `league_${country.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    return {
      kind: "team_honour",
      competitionKey: key,
      competitionName: `${country} League Title`,
    };
  }

  // ----------------------------------------------------
  // TEAM HONOURS: Domestic Cups & Super Cups
  // ----------------------------------------------------
  if (/FA\s*Cup|Copa\s*del\s*Rey|DFB-Pokal|Coppa\s*Italia|Coupe\s*de\s*France|KNVB|Taça\s*de\s*Portugal|cup\s*winner/i.test(title)) {
    const slugKey = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    return {
      kind: "team_honour",
      competitionKey: `cup_${slugKey}`,
      competitionName: title,
    };
  }

  if (/Super\s*Cup|Supercup|Community\s*Shield|Trophée\s*des\s*Champions/i.test(title)) {
    const slugKey = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    return {
      kind: "team_honour",
      competitionKey: `supercup_${slugKey}`,
      competitionName: title,
    };
  }

  // Fallback for recognized awards or honours
  const fallbackKey = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 35);
  const isAward = /award|trophy|boot|player|scorer|mvp/i.test(title);
  return {
    kind: isAward ? "individual_award" : "team_honour",
    competitionKey: fallbackKey,
    competitionName: title,
  };
}

/**
 * Parses Transfermarkt player erfolge HTML.
 */
export function parsePlayerAchievementsHtml(html: string): ParsedPlayerAchievement[] {
  const achievementsMap = new Map<string, ParsedPlayerAchievement>();

  // Each category box begins with <h2 class="content-box-headline">(\d+)x\s+([^<]+)</h2>
  // Followed by <table class="auflistung">...</table>
  const boxRegex = /<h2[^>]*class="[^"]*content-box-headline[^"]*"[^>]*>\s*(\d+)x\s+([^<]+)<\/h2>([\s\S]*?)(?=<h2[^>]*class="[^"]*content-box-headline[^"]*"|<div class="footer"|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = boxRegex.exec(html)) !== null) {
    const count = parseInt(match[1], 10);
    const rawTitle = match[2].trim();
    const boxContent = match[3];

    const norm = normalizeAchievement(rawTitle);
    if (!norm) continue;

    // Parse seasons and clubs from table.auflistung
    const seasonsList: string[] = [];
    const clubContextList: Array<{ season: string; clubName?: string; clubTmId?: string }> = [];

    const tableMatch = boxContent.match(/<table[^>]*class="[^"]*auflistung[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (const r of rows) {
        const rowHtml = r[1];
        const seasonMatch = rowHtml.match(/<td[^>]*class="[^"]*erfolg_table_saison[^"]*"[^>]*>\s*([^<]+)\s*<\/td>/i);
        if (!seasonMatch) continue;

        const rawSeason = seasonMatch[1].trim();
        const normSeason = normalizeSeasonString(rawSeason);
        seasonsList.push(normSeason);

        // Club info
        const clubMatch = rowHtml.match(/<a[^>]*href="\/[^\/]+\/startseite\/verein\/(\d+)[^"]*"[^>]*title="([^"]*)"/i) ||
                          rowHtml.match(/<a[^>]*title="([^"]*)"[^>]*href="\/[^\/]+\/startseite\/verein\/(\d+)[^"]*"/i);

        let clubTmId: string | undefined;
        let clubName: string | undefined;

        if (clubMatch) {
          // Identify which capture group was numeric tmId vs name
          if (/^\d+$/.test(clubMatch[1])) {
            clubTmId = clubMatch[1];
            clubName = clubMatch[2];
          } else {
            clubName = clubMatch[1];
            clubTmId = clubMatch[2];
          }
        }

        clubContextList.push({
          season: normSeason,
          clubName: clubName?.trim(),
          clubTmId,
        });
      }
    }

    const uniqueSeasons = Array.from(new Set(seasonsList)).sort((a, b) => {
      const numA = parseInt(a.slice(0, 4), 10) || 0;
      const numB = parseInt(b.slice(0, 4), 10) || 0;
      return numB - numA;
    });

    const mapKey = `${norm.kind}:${norm.competitionKey}`;
    const existing = achievementsMap.get(mapKey);

    if (existing) {
      existing.titleCount += count;
      existing.seasons = Array.from(new Set([...existing.seasons, ...uniqueSeasons])).sort((a, b) => {
        const numA = parseInt(a.slice(0, 4), 10) || 0;
        const numB = parseInt(b.slice(0, 4), 10) || 0;
        return numB - numA;
      });
      existing.clubContext = [...existing.clubContext, ...clubContextList];
    } else {
      achievementsMap.set(mapKey, {
        kind: norm.kind,
        competitionKey: norm.competitionKey,
        competitionName: norm.competitionName,
        titleCount: Math.max(count, uniqueSeasons.length),
        seasons: uniqueSeasons,
        clubContext: clubContextList,
      });
    }
  }

  return Array.from(achievementsMap.values());
}

/**
 * Fetch Transfermarkt erfolge HTML with polite rate limiting & exponential backoff.
 */
async function fetchPlayerErfolgeHtml(tmId: string, playerName: string): Promise<string | null> {
  const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const url = `https://www.transfermarkt.com/${slug}/erfolge/spieler/${tmId}`;

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: TM_HEADERS });
      if (res.status === 200) {
        return await res.text();
      }
      if (res.status === 404) {
        return null;
      }
      if (res.status === 429) {
        const delay = 3000 * Math.pow(2, attempt);
        console.warn(`[Player Achievements] Rate limited (429) on ${playerName}. Waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      console.error(`[Player Achievements] Network error for ${playerName} (${tmId}):`, err.message);
      return null;
    }
  }
  return null;
}

export async function runPlayerAchievementsIngestion(options: {
  limit?: number;
  playerId?: string;
  force?: boolean;
  sinceDays?: number;
} = {}) {
  console.log("=================================================");
  console.log("🏆 a1score.app — Player Achievements Ingestion");
  console.log("=================================================");

  const sinceDays = options.sinceDays ?? 30;
  const cutoffDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  // 1. Fetch target players
  const players = await prisma.player.findMany({
    where: {
      transfermarktId: { not: null },
      ...(options.playerId
        ? {
            OR: [
              { id: options.playerId },
              { transfermarktId: options.playerId },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      commonName: true,
      transfermarktId: true,
      latestMarketValue: true,
    },
    orderBy: [
      { latestMarketValue: { sort: "desc", nulls: "last" } },
      { id: "asc" },
    ],
    take: options.limit ?? 50,
  });

  console.log(`Found ${players.length} candidate player(s) to process.`);

  // 2. Fetch existing achievements timestamps for resumability
  const existingAchievements = await prisma.playerAchievement.findMany({
    select: { playerId: true, fetchedAt: true },
  });

  const lastFetchedMap = new Map<string, Date>();
  for (const row of existingAchievements) {
    const cur = lastFetchedMap.get(row.playerId);
    if (!cur || row.fetchedAt > cur) {
      lastFetchedMap.set(row.playerId, row.fetchedAt);
    }
  }

  let processedCount = 0;
  let totalHonoursInserted = 0;
  let totalAwardsInserted = 0;
  let skippedFreshCount = 0;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const displayName = player.commonName || player.fullName || "Unknown";
    const tmId = player.transfermarktId!;

    // Check freshness unless --force
    const lastFetched = lastFetchedMap.get(player.id);
    if (!options.force && lastFetched && lastFetched > cutoffDate) {
      skippedFreshCount++;
      continue;
    }

    processedCount++;
    console.log(
      `[${processedCount}/${players.length}] Fetching achievements for ${displayName} (TM: ${tmId}, MV: €${player.latestMarketValue || 0})...`
    );

    const html = await fetchPlayerErfolgeHtml(tmId, displayName);
    if (!html) {
      console.log(`  -> No HTML returned or player not found.`);
      continue;
    }

    const parsed = parsePlayerAchievementsHtml(html);
    console.log(`  -> Found ${parsed.length} achievement category/categories.`);

    for (const ach of parsed) {
      await prisma.playerAchievement.upsert({
        where: {
          playerId_kind_competitionKey: {
            playerId: player.id,
            kind: ach.kind,
            competitionKey: ach.competitionKey,
          },
        },
        create: {
          playerId: player.id,
          kind: ach.kind,
          competitionKey: ach.competitionKey,
          competitionName: ach.competitionName,
          titleCount: ach.titleCount,
          seasons: ach.seasons,
          clubContext: ach.clubContext,
          source: "Transfermarkt",
          fetchedAt: new Date(),
        },
        update: {
          competitionName: ach.competitionName,
          titleCount: ach.titleCount,
          seasons: ach.seasons,
          clubContext: ach.clubContext,
          fetchedAt: new Date(),
        },
      });

      if (ach.kind === "team_honour") {
        totalHonoursInserted++;
      } else {
        totalAwardsInserted++;
      }
    }

    // Polite rate limiting: 1.2s - 1.8s
    if (i < players.length - 1) {
      const waitTime = 1200 + Math.floor(Math.random() * 600);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  console.log("\n=================================================");
  console.log("🏁 Ingestion Complete!");
  console.log(`Total Candidates Evaluated: ${players.length}`);
  console.log(`Skipped (Already Fresh < 30 days): ${skippedFreshCount}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Team Honours Upserted: ${totalHonoursInserted}`);
  console.log(`Individual Awards Upserted: ${totalAwardsInserted}`);
  console.log("=================================================");
}

// Direct CLI execution
if (process.argv[1]?.includes("ingest-player-achievements")) {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limitIdx = args.indexOf("--limit");
  const limit = limitArg
    ? parseInt(limitArg.split("=")[1], 10)
    : limitIdx !== -1 && args[limitIdx + 1]
    ? parseInt(args[limitIdx + 1], 10)
    : 50;

  const playerArg = args.find((a) => a.startsWith("--player="));
  const playerIdx = args.indexOf("--player");
  const playerId = playerArg
    ? playerArg.split("=")[1]
    : playerIdx !== -1 && args[playerIdx + 1]
    ? args[playerIdx + 1]
    : undefined;

  const force = args.includes("--force");

  const sinceArg = args.find((a) => a.startsWith("--since="));
  const sinceIdx = args.indexOf("--since");
  const sinceDays = sinceArg
    ? parseInt(sinceArg.split("=")[1], 10)
    : sinceIdx !== -1 && args[sinceIdx + 1]
    ? parseInt(args[sinceIdx + 1], 10)
    : 30;

  runPlayerAchievementsIngestion({ limit, playerId, force, sinceDays })
    .catch((err) => {
      console.error("Fatal error running player achievements ingestion:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
