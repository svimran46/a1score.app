import { supabase } from "@/lib/supabase";
import {
  getLeagueStandings,
  OFFICIAL_LEAGUE_CLUB_COUNTS,
  FotmobStandingsRow,
} from "@/lib/fotmob/client";

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
      .map((league) => ({
        id: league.id,
        name: league.name,
        country: league.country,
        tier: league.tier || 1,
        logoUrl: league.logoUrl,
        clubCount:
          OFFICIAL_LEAGUE_CLUB_COUNTS[league.transfermarktId] ?? (league.clubCount ?? 0),
        totalPlayers: league.totalPlayers ?? 0,
        totalMarketValue: league.totalMarketValue ? Number(league.totalMarketValue) : 0,
      }));
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
          totalMarketValue
        )
      `)
      .or(`id.eq.${id},transfermarktId.eq.${id}`)
      .maybeSingle();

    if (error || !league) {
      console.error(`Error fetching league ${id}:`, error);
      return null;
    }

    // Attempt to fetch official live standings from FotMob
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

    const officialCount =
      fotmobData?.teamsCount ||
      OFFICIAL_LEAGUE_CLUB_COUNTS[league.transfermarktId] ||
      league.clubCount ||
      0;

    const rankedClubs = (league.clubs || [])
      .map((club: any) => ({
        id: club.id,
        name: club.name,
        logoUrl: club.logoUrl,
        country: club.country,
        squadSize: club.squadSize ?? 0,
        totalSquadValue: club.totalMarketValue ? Number(club.totalMarketValue) : 0,
      }))
      .sort((a: any, b: any) => b.totalSquadValue - a.totalSquadValue);

    // Merge standings with database squad values
    const enrichedStandings = (fotmobData?.standings || []).map((row) => {
      const matchedClub = rankedClubs.find(
        (c) =>
          c.name.toLowerCase() === row.name.toLowerCase() ||
          c.name.toLowerCase().includes(row.shortName?.toLowerCase() || "") ||
          row.name.toLowerCase().includes(c.name.toLowerCase())
      );

      return {
        ...row,
        clubId: matchedClub?.id || null,
        totalSquadValue: matchedClub?.totalSquadValue || 0,
      };
    });

    return {
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      logoUrl: league.logoUrl,
      transfermarktId: league.transfermarktId,
      totalMarketValue: league.totalMarketValue ? Number(league.totalMarketValue) : 0,
      totalPlayers: league.totalPlayers ?? 0,
      clubCount: officialCount,
      clubs: rankedClubs,
      standings: enrichedStandings,
      season: fotmobData?.season || "2024/2025",
    };
  } catch (error) {
    console.error(`Error fetching league ${id}:`, error);
    return null;
  }
}
