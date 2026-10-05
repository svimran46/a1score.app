/**
 * src/lib/data/playerAchievements.ts
 *
 * Data Access Layer for Player Achievements (Honours and Individual Awards).
 * Backed by Supabase with L1 in-memory caching and resilient stale-while-revalidate fallback.
 */

import { supabase } from "@/lib/supabase";
import { getCachedOrFetch } from "@/lib/cache";

export interface PlayerAchievementClubContext {
  season: string;
  clubName?: string;
  clubTmId?: string;
}

export interface PlayerAchievementItem {
  id: string;
  playerId: string;
  kind: "team_honour" | "individual_award";
  competitionKey: string;
  competitionName: string;
  titleCount: number;
  seasons: string[];
  clubContext: PlayerAchievementClubContext[];
  source: string;
  fetchedAt: string | null;
}

export interface PlayerAchievementsGrouped {
  majorHonours: PlayerAchievementItem[];
  domesticCupsAndOther: PlayerAchievementItem[];
  individualAwards: PlayerAchievementItem[];
  all: PlayerAchievementItem[];
  totalTitles: number;
}

/**
 * Checks whether an achievement is considered a "Major Honour"
 * (League titles, Champions League, World Cup, Euros, Copa América, Club World Cup).
 */
export function isMajorHonour(item: PlayerAchievementItem): boolean {
  if (item.kind !== "team_honour") return false;
  const key = item.competitionKey.toLowerCase();
  return (
    key === "ucl" ||
    key === "world_cup" ||
    key === "european_championship" ||
    key === "copa_america" ||
    key === "afcon" ||
    key === "club_world_cup" ||
    key.startsWith("league_")
  );
}

/**
 * Fetches all achievements for a player and organizes them cleanly.
 * Cached in-memory with single-flight deduplication and graceful fallback.
 */
export async function getPlayerAchievements(
  playerId: string
): Promise<PlayerAchievementsGrouped> {
  const emptyResult: PlayerAchievementsGrouped = {
    majorHonours: [],
    domesticCupsAndOther: [],
    individualAwards: [],
    all: [],
    totalTitles: 0,
  };

  if (!playerId) return emptyResult;

  const cacheKey = `player_achievements_${playerId}`;

  try {
    return await getCachedOrFetch(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("PlayerAchievement")
          .select(
            "id, playerId, kind, competitionKey, competitionName, titleCount, seasons, clubContext, source, fetchedAt"
          )
          .eq("playerId", playerId)
          .order("titleCount", { ascending: false });

        if (error) {
          console.warn(
            `[PlayerAchievements Data] Supabase error for player ${playerId}:`,
            error.message
          );
          return emptyResult;
        }

        if (!data || data.length === 0) {
          return emptyResult;
        }

        const items: PlayerAchievementItem[] = (data as any[]).map((row) => {
          const seasons = Array.isArray(row.seasons) ? row.seasons : [];
          const clubContext = Array.isArray(row.clubContext) ? row.clubContext : [];

          return {
            id: row.id,
            playerId: row.playerId,
            kind: row.kind === "individual_award" ? "individual_award" : "team_honour",
            competitionKey: row.competitionKey,
            competitionName: row.competitionName,
            titleCount: Number(row.titleCount) || 0,
            seasons,
            clubContext,
            source: row.source || "Transfermarkt",
            fetchedAt: row.fetchedAt ? new Date(row.fetchedAt).toISOString() : null,
          };
        });

        // Split into categories
        const majorHonours: PlayerAchievementItem[] = [];
        const domesticCupsAndOther: PlayerAchievementItem[] = [];
        const individualAwards: PlayerAchievementItem[] = [];

        for (const it of items) {
          if (it.kind === "individual_award") {
            individualAwards.push(it);
          } else if (isMajorHonour(it)) {
            majorHonours.push(it);
          } else {
            domesticCupsAndOther.push(it);
          }
        }

        // Sort items logically within sections
        const sortMajor = (a: PlayerAchievementItem, b: PlayerAchievementItem) => {
          // UCL / World Cup first, then leagues by count
          const rankA = a.competitionKey === "world_cup" ? 3 : a.competitionKey === "ucl" ? 2 : 1;
          const rankB = b.competitionKey === "world_cup" ? 3 : b.competitionKey === "ucl" ? 2 : 1;
          if (rankA !== rankB) return rankB - rankA;
          return b.titleCount - a.titleCount;
        };

        const sortGeneral = (a: PlayerAchievementItem, b: PlayerAchievementItem) =>
          b.titleCount - a.titleCount;

        majorHonours.sort(sortMajor);
        domesticCupsAndOther.sort(sortGeneral);
        individualAwards.sort(sortGeneral);

        const totalTitles = items.reduce((acc, curr) => acc + curr.titleCount, 0);

        return {
          majorHonours,
          domesticCupsAndOther,
          individualAwards,
          all: items,
          totalTitles,
        };
      },
      86400 // 24-hour cache
    );
  } catch (err: any) {
    console.warn(
      `[PlayerAchievements Data] Resilient fallback triggered for player ${playerId}:`,
      err.message
    );
    return emptyResult;
  }
}
