/**
 * src/lib/data/honours.ts
 *
 * Honours Data Access Layer for Club Achievements
 * Domestic first-tier league titles ("domestic_league") and UEFA Champions League ("ucl").
 *
 * Backed by Supabase with L1 in-memory caching and resilient stale-while-revalidate fallbacks.
 */

import { supabase } from "@/lib/supabase";
import { getCachedOrFetch } from "@/lib/cache";

export interface ClubHonourItem {
  id: string;
  clubId: string;
  competitionKey: "domestic_league" | "ucl" | string;
  competitionName: string;
  titleCount: number;
  seasons: string[];
  latestSeason: string | null;
  source: string;
  fetchedAt: string | null;
}

/**
 * Fetches all official honours for a given club.
 * Cached in-memory with single-flight deduplication and graceful fallback.
 */
export async function getClubHonours(clubId: string): Promise<ClubHonourItem[]> {
  if (!clubId) return [];

  const cacheKey = `club_honours_${clubId}`;

  try {
    return await getCachedOrFetch(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("ClubHonour")
          .select("id, clubId, competitionKey, competitionName, titleCount, seasons, source, fetchedAt")
          .eq("clubId", clubId)
          .order("titleCount", { ascending: false });

        if (error) {
          console.warn(`[Honours Data] Supabase error fetching honours for club ${clubId}:`, error.message);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        // Normalize and sort: UCL first, then domestic_league (or by titleCount desc)
        return (data as any[])
          .map((row) => {
            const seasons = Array.isArray(row.seasons) ? row.seasons : [];
            return {
              id: row.id,
              clubId: row.clubId,
              competitionKey: row.competitionKey,
              competitionName: row.competitionName,
              titleCount: Number(row.titleCount) || 0,
              seasons,
              latestSeason: seasons.length > 0 ? seasons[0] : null,
              source: row.source || "Transfermarkt",
              fetchedAt: row.fetchedAt ? new Date(row.fetchedAt).toISOString() : null,
            };
          })
          .sort((a, b) => {
            // Priority: UCL first if exists, then domestic_league
            if (a.competitionKey === "ucl" && b.competitionKey !== "ucl") return -1;
            if (b.competitionKey === "ucl" && a.competitionKey !== "ucl") return 1;
            return b.titleCount - a.titleCount;
          });
      },
      86400 // 24-hour cache
    );
  } catch (err: any) {
    console.warn(`[Honours Data] Resilient fallback triggered for club ${clubId}:`, err.message);
    return [];
  }
}
