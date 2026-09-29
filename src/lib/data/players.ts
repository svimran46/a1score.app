import { supabase } from "@/lib/supabase";
import {
  tmGetMostValuablePlayers,
  tmGetPlayer,
  tmSearchPlayers,
} from "@/lib/transfermarkt/client";
import { getFotmobPlayerStats } from "@/lib/fotmob/client";

export async function getMostValuablePlayers(limit = 10, positionFilter?: string) {
  // 1. First, attempt to fetch live worldwide rankings directly via Transfermarkt proxy
  try {
    const liveRanking = await tmGetMostValuablePlayers(limit, positionFilter);
    if (liveRanking && liveRanking.length > 0) {
      return liveRanking.slice(0, limit);
    }
  } catch (proxyErr) {
    console.warn("[Data Layer] TM Live Proxy unavailable, falling back to DB:", proxyErr);
  }

  // 2. Fallback to Supabase Database (sorted by indexed latestMarketValue)
  try {
    let builder = supabase
      .from("Player")
      .select(`
        id,
        fullName,
        commonName,
        position,
        subPosition,
        photoUrl,
        transfermarktId,
        nationality,
        dateOfBirth,
        latestMarketValue,
        currentClub:Club (
          id,
          name,
          logoUrl,
          league:League ( name )
        )
      `)
      .order("latestMarketValue", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (positionFilter) {
      builder = builder.or(`position.ilike.%${positionFilter}%,subPosition.ilike.%${positionFilter}%`);
    }

    const { data: players, error } = await builder;

    if (error || !players) {
      console.error("Error fetching most valuable players from DB:", error);
      return [];
    }

    return players.map((p: any) => ({
      ...p,
      latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
    }));
  } catch (error) {
    console.error("Error fetching most valuable players:", error);
    return [];
  }
}

export async function getPlayerBySlugOrId(slugOrId: string) {
  // 1. First, attempt to fetch live profile + valuation graph + transfers via TM proxy
  try {
    const livePlayer = await tmGetPlayer(slugOrId);
    if (livePlayer) {
      if (!livePlayer.seasonStats || livePlayer.seasonStats.length === 0) {
        try {
          const fotmobData = await getFotmobPlayerStats(livePlayer.commonName || livePlayer.fullName);
          if (fotmobData && fotmobData.seasonStats && fotmobData.seasonStats.length > 0) {
            livePlayer.seasonStats = fotmobData.seasonStats;
          }
        } catch (e) {
          // ignore error
        }
      }
      return livePlayer;
    }
  } catch (proxyErr) {
    console.warn(`[Data Layer] TM Live Proxy failed for ${slugOrId}, falling back to DB:`, proxyErr);
  }

  // 2. Fallback to Supabase Database
  try {
    const parts = slugOrId.split("-");
    const possibleTmId = parts[parts.length - 1];

    const { data: player, error } = await supabase
      .from("Player")
      .select(`
        *,
        currentClub:Club (
          *,
          league:League ( * )
        ),
        marketValues:MarketValueHistory (
          *
        ),
        seasonStats:SeasonStats (
          *
        ),
        transfers:Transfer (
          *
        ),
        injuries:Injury (
          *
        )
      `)
      .or(`id.eq.${slugOrId},transfermarktId.eq.${possibleTmId},transfermarktId.eq.${slugOrId}`)
      .maybeSingle();

    if (error || !player) {
      console.error(`Error fetching player ${slugOrId} from DB:`, error);
      return null;
    }

    // Sort market values chronologically (asc) for charts
    const sortedMarketValues = (player.marketValues || [])
      .map((mv: any) => ({
        ...mv,
        valueEur: Number(mv.valueEur),
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sort transfers chronologically (desc)
    const sortedTransfers = (player.transfers || [])
      .map((t: any) => ({
        ...t,
        feeEur: t.feeEur ? Number(t.feeEur) : null,
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Sort stats by season (desc)
    let sortedSeasonStats = (player.seasonStats || []).sort(
      (a: any, b: any) => b.season?.localeCompare?.(a.season ?? "") ?? 0
    );

    // If seasonStats is empty, enrich with authentic FotMob tournament statistics
    let injuries = player.injuries || [];
    if (sortedSeasonStats.length === 0) {
      try {
        const fotmobData = await getFotmobPlayerStats(player.commonName || player.fullName);
        if (fotmobData && fotmobData.seasonStats && fotmobData.seasonStats.length > 0) {
          sortedSeasonStats = fotmobData.seasonStats;
        }
        if (fotmobData && fotmobData.injury && injuries.length === 0) {
          injuries = [
            {
              id: `fotmob-inj-${fotmobData.id}`,
              type: fotmobData.injury.injuryType || "Injury",
              startDate: fotmobData.injury.startDate || new Date().toISOString(),
              endDate: fotmobData.injury.expectedReturn || null,
              status: "active",
            },
          ];
        }
      } catch (err) {
        console.warn(`[Data Layer] FotMob enrichment failed for ${player.fullName}:`, err);
      }
    }

    return {
      ...player,
      latestMarketValue: player.latestMarketValue
        ? Number(player.latestMarketValue)
        : sortedMarketValues[sortedMarketValues.length - 1]?.valueEur || 0,
      marketValues: sortedMarketValues,
      transfers: sortedTransfers,
      seasonStats: sortedSeasonStats,
      injuries,
    };
  } catch (error) {
    console.error(`Error fetching player ${slugOrId}:`, error);
    return null;
  }
}

export async function searchPlayers(
  query: string,
  options: { position?: string; clubId?: string; limit?: number } = {}
) {
  const { position, clubId, limit = 20 } = options;

  // 1. Live search via Transfermarkt proxy when searching by name
  if (query && !clubId) {
    try {
      const liveResults = await tmSearchPlayers(query, { position, limit });
      if (liveResults && liveResults.length > 0) {
        return liveResults;
      }
    } catch (proxyErr) {
      console.warn("[Data Layer] TM Live Search failed, falling back to DB:", proxyErr);
    }
  }

  // 2. Fallback to Supabase Database
  try {
    let builder = supabase
      .from("Player")
      .select(`
        id,
        fullName,
        commonName,
        position,
        subPosition,
        photoUrl,
        transfermarktId,
        latestMarketValue,
        currentClub:Club (
          id,
          name,
          logoUrl,
          league:League ( id, name )
        )
      `)
      .order("latestMarketValue", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (query) {
      builder = builder.or(`fullName.ilike.%${query}%,commonName.ilike.%${query}%`);
    }

    if (position) {
      builder = builder.ilike("position", position);
    }

    if (clubId) {
      builder = builder.eq("currentClubId", clubId);
    }

    const { data: players, error } = await builder;

    if (error || !players) {
      console.error("Error searching players in DB:", error);
      return [];
    }

    return players.map((p: any) => ({
      ...p,
      latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
    }));
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}
