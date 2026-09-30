import { supabase } from "@/lib/supabase";
import {
  getLeagueStandings,
  FotmobStandingsRow,
  OFFICIAL_LEAGUE_CLUB_COUNTS,
} from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";

export async function getLeagues() {
  try {
    const { data: leagues, error } = await supabase
      .from("League")
      .select(`
        id,
        name,
        country,
        tier,
        logoUrl,
        transfermarktId,
        clubCount,
        totalPlayers,
        totalMarketValue
      `)
      .order("totalMarketValue", { ascending: false });

    if (error || !leagues) {
      console.error("Error fetching leagues:", error);
      return [];
    }

    return leagues
      .filter((l) => l.transfermarktId !== "CL" || Number(l.totalMarketValue) > 0)
      .map((league) => {
        const officialClubCount =
          (league.transfermarktId && OFFICIAL_LEAGUE_CLUB_COUNTS[league.transfermarktId]) ||
          league.clubCount ||
          20;
        const totalMarketValue = league.totalMarketValue ? Number(league.totalMarketValue) : 0;
        const avgSquadValue = officialClubCount > 0 ? Math.round(totalMarketValue / officialClubCount) : 0;

        return {
          id: league.id,
          name: league.name,
          country: league.country,
          tier: league.tier || 1,
          logoUrl: sanitizeImageUrl(league.logoUrl, "league", league.id),
          clubCount: officialClubCount,
          totalPlayers: league.totalPlayers ?? 0,
          totalMarketValue,
          avgSquadValue,
        };
      });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export async function getLeagueById(id: string) {
  try {
    const { data: league, error } = await supabase
      .from("League")
      .select(`
        id,
        name,
        country,
        tier,
        logoUrl,
        transfermarktId,
        totalMarketValue,
        totalPlayers,
        clubCount,
        clubs:Club (
          id,
          name,
          logoUrl,
          country,
          squadSize,
          totalMarketValue,
          lastSeason,
          transfermarktId
        )
      `)
      .or(`id.eq.${id},transfermarktId.eq.${id}`)
      .maybeSingle();

    if (error || !league) {
      console.error(`Error fetching league ${id}:`, error);
      return null;
    }

    // 1. Fetch official standings from FotMob
    let fotmobData: {
      leagueId: number;
      season?: string;
      teamsCount: number;
      standings: FotmobStandingsRow[];
    } | null = null;

    try {
      fotmobData = await getLeagueStandings(league.transfermarktId);
    } catch (e) {
      console.warn(`[Data Layer] FotMob standings fetch failed for league ${league.name}:`, e);
    }

    // 2. Fetch global clubs for fallback/promoted club resolution
    let allClubs = league.clubs || [];
    try {
      const { data: globalClubs } = await supabase
        .from("Club")
        .select("id, name, logoUrl, country, squadSize, totalMarketValue, lastSeason, transfermarktId");
      if (globalClubs && globalClubs.length > 0) {
        allClubs = globalClubs;
      }
    } catch (e) {
      console.warn("Could not fetch global clubs for league enrichment:", e);
    }

    // 3. Derive each league's club list and standings directly from the current season standings
    const enrichedStandings = (fotmobData?.standings || []).map((row) => {
      let matched: any = null;

      // Check explicit mapping table
      if (FOTMOB_TEAM_MAPPINGS[row.id]) {
        const target = FOTMOB_TEAM_MAPPINGS[row.id];
        matched = allClubs.find(
          (c: any) =>
            (target.tmId && c.transfermarktId === target.tmId) ||
            (target.name && c.name.toLowerCase() === target.name.toLowerCase())
        );
      }

      // Check fuzzy name matching if not resolved
      if (!matched) {
        const cleanT = row.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanShort = (row.shortName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        matched = allClubs.find((c: any) => {
          const cleanC = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            cleanC === cleanT ||
            cleanC.includes(cleanT) ||
            cleanT.includes(cleanC) ||
            (cleanShort && (cleanC.includes(cleanShort) || cleanShort.includes(cleanC)))
          );
        });
      }

      const squadValue = matched?.totalMarketValue ? Number(matched.totalMarketValue) : 0;
      const squadSize = matched?.squadSize || 25;
      const clubId = matched?.id || null;

      return {
        ...row,
        clubId,
        totalSquadValue: squadValue,
        squadSize,
        imageUrl: matched?.logoUrl
          ? sanitizeImageUrl(matched.logoUrl, "club", matched.id)
          : sanitizeImageUrl(row.imageUrl, "club"),
      };
    });

    // 4. Derive active ranked clubs directly from current season standings
    const derivedClubs = enrichedStandings
      .filter((s) => s.clubId !== null)
      .map((s) => {
        const dbC = allClubs.find((c: any) => c.id === s.clubId);
        return {
          id: s.clubId!,
          name: dbC?.name || s.name,
          logoUrl: s.imageUrl,
          country: dbC?.country || league.country,
          squadSize: s.squadSize || 25,
          totalSquadValue: s.totalSquadValue,
          lastSeason: 2026,
        };
      })
      .sort((a, b) => b.totalSquadValue - a.totalSquadValue);

    const officialCount = enrichedStandings.length > 0 ? enrichedStandings.length : league.clubCount || 0;
    const computedTotalValue = derivedClubs.reduce((sum, c) => sum + c.totalSquadValue, 0);
    const computedTotalPlayers = derivedClubs.reduce((sum, c) => sum + c.squadSize, 0);

    return {
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      logoUrl: sanitizeImageUrl(league.logoUrl, "league", league.id),
      transfermarktId: league.transfermarktId,
      totalMarketValue: computedTotalValue > 0 ? computedTotalValue : Number(league.totalMarketValue || 0),
      totalPlayers: computedTotalPlayers > 0 ? computedTotalPlayers : league.totalPlayers ?? 0,
      clubCount: officialCount,
      clubs: derivedClubs,
      standings: enrichedStandings,
      season: fotmobData?.season || "2026/2027",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching league ${id}:`, error);
    return null;
  }
}
