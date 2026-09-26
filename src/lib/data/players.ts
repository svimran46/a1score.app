import { supabase } from "@/lib/supabase";

export async function getMostValuablePlayers(limit = 10) {
  // Fetch a pool large enough to produce a true world ranking after
  // in-memory sort by latest market value. Supabase cannot sort by
  // joined MarketValueHistory at DB level, so we over-fetch.
  const poolSize = Math.min(Math.max(limit * 4, 50), 250);
  try {
    const { data: players, error } = await supabase
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
        currentClub:Club (
          id,
          name,
          logoUrl,
          league:League ( name )
        ),
        marketValues:MarketValueHistory (
          valueEur,
          date
        )
      `)
      .limit(poolSize);

    if (error || !players) {
      console.error("Error fetching most valuable players:", error);
      return [];
    }

    return players
      .map((p: any) => {
        const sorted = [...(p.marketValues || [])].sort(
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latestMarketValue = sorted[0]?.valueEur ? Number(sorted[0].valueEur) : 0;
        return {
          ...p,
          latestMarketValue,
        };
      })
      .sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching most valuable players:", error);
    return [];
  }
}

export async function getPlayerBySlugOrId(slugOrId: string) {
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
      console.error(`Error fetching player ${slugOrId}:`, error);
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
    const sortedSeasonStats = (player.seasonStats || []).sort(
      (a: any, b: any) => b.season?.localeCompare?.(a.season ?? "") ?? 0
    );

    return {
      ...player,
      marketValues: sortedMarketValues,
      transfers: sortedTransfers,
      seasonStats: sortedSeasonStats,
      injuries: player.injuries || [],
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
        currentClub:Club (
          id,
          name,
          logoUrl,
          league:League ( id, name )
        ),
        marketValues:MarketValueHistory (
          valueEur,
          date
        )
      `)
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
      console.error("Error searching players:", error);
      return [];
    }

    return players.map((p: any) => {
      const sorted = [...(p.marketValues || [])].sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestMarketValue = sorted[0]?.valueEur ? Number(sorted[0].valueEur) : 0;
      return {
        ...p,
        latestMarketValue,
      };
    });
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}
