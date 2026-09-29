import { supabase } from "@/lib/supabase";
import {
  tmGetMostValuablePlayers,
  tmGetPlayer,
  tmSearchPlayers,
} from "@/lib/transfermarkt/client";
import { getFotmobPlayerStats } from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";

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

    return players.map((p: any) => {
      const clubRaw = p.currentClub;
      const currentClub = Array.isArray(clubRaw) ? clubRaw[0] || null : clubRaw || null;
      const extId = p.transfermarktId || p.id;
      return {
        ...p,
        sourceId: extId,
        slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
        photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
        latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
        currentClub: currentClub
          ? {
              ...currentClub,
              logoUrl: sanitizeImageUrl(currentClub.logoUrl, "club", currentClub.id),
            }
          : null,
      };
    });
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

    const extId = player.transfermarktId || player.id;
    const clubRaw = player.currentClub;
    const currentClub = Array.isArray(clubRaw) ? clubRaw[0] || null : clubRaw || null;

    return {
      ...player,
      sourceId: extId,
      slug: `${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
      photoUrl: sanitizeImageUrl(player.photoUrl, "player", extId),
      currentClub: currentClub
        ? {
            ...currentClub,
            logoUrl: sanitizeImageUrl(currentClub.logoUrl, "club", currentClub.id),
          }
        : null,
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

    return players.map((p: any) => {
      const clubRaw = p.currentClub;
      const currentClub = Array.isArray(clubRaw) ? clubRaw[0] || null : clubRaw || null;
      const extId = p.transfermarktId || p.id;
      return {
        ...p,
        sourceId: extId,
        slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
        photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
        latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
        currentClub: currentClub
          ? {
              ...currentClub,
              logoUrl: sanitizeImageUrl(currentClub.logoUrl, "club", currentClub.id),
            }
          : null,
      };
    });
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}

export interface MarketMover {
  id: string;
  fullName: string;
  commonName?: string | null;
  slug: string;
  position: string;
  photoUrl?: string | null;
  currentClub?: {
    id?: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  latestValue: number;
  prevValue: number;
  diff: number;
  percentage: number;
  lastUpdated?: string;
}

/**
 * Computes authentic market value risers and fallers based on chronological valuation records
 */
export async function getMarketValueMovers(limit = 6): Promise<{ risers: MarketMover[]; fallers: MarketMover[] }> {
  try {
    const { data: players, error } = await supabase
      .from("Player")
      .select(`
        id,
        fullName,
        commonName,
        position,
        photoUrl,
        transfermarktId,
        latestMarketValue,
        currentClub:Club (
          id,
          name,
          logoUrl
        ),
        marketValues:MarketValueHistory (
          date,
          valueEur
        )
      `)
      .order("latestMarketValue", { ascending: false, nullsFirst: false })
      .limit(60);

    if (error || !players) {
      console.error("Error fetching market value movers:", error);
      return { risers: [], fallers: [] };
    }

    const calculatedMovers: MarketMover[] = [];

    for (const p of players) {
      const mvs = (p.marketValues || []).sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (mvs.length >= 2) {
        const latestPoint = mvs[mvs.length - 1];
        const prevPoint = mvs[mvs.length - 2];
        const latestVal = Number(latestPoint.valueEur);
        const prevVal = Number(prevPoint.valueEur);
        const diff = latestVal - prevVal;
        const percentage = prevVal > 0 ? (diff / prevVal) * 100 : 0;

        const slug = `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
          p.transfermarktId || p.id
        }`;

        const clubRaw = (p as any).currentClub;
        const currentClub = Array.isArray(clubRaw) ? clubRaw[0] || null : clubRaw || null;

        calculatedMovers.push({
          id: p.id,
          fullName: p.fullName,
          commonName: p.commonName,
          slug,
          position: p.position,
          photoUrl: sanitizeImageUrl(p.photoUrl, "player", p.transfermarktId || p.id),
          currentClub: currentClub
            ? {
                ...currentClub,
                logoUrl: sanitizeImageUrl(currentClub.logoUrl, "club", currentClub.id),
              }
            : null,
          latestValue: latestVal,
          prevValue: prevVal,
          diff,
          percentage,
          lastUpdated: latestPoint.date,
        });
      }
    }

    const risers = calculatedMovers
      .filter((m) => m.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, limit);

    const fallers = calculatedMovers
      .filter((m) => m.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, limit);

    return { risers, fallers };
  } catch (err) {
    console.error("Failed to compute market value movers:", err);
    return { risers: [], fallers: [] };
  }
}

export interface PositionalPeer {
  id: string;
  fullName: string;
  commonName?: string | null;
  slug: string;
  position: string;
  subPosition?: string | null;
  dateOfBirth?: string | Date | null;
  photoUrl?: string | null;
  latestMarketValue: number;
  currentClub?: {
    name: string;
    logoUrl?: string | null;
  } | null;
  rank: number;
}

/**
 * Retrieves top worldwide peers playing in the same primary position
 */
export async function getPositionalPeers(
  position: string,
  excludePlayerId: string,
  limit = 5
): Promise<PositionalPeer[]> {
  try {
    // Simplify position to primary category if needed (e.g. "Central Midfield" -> "Midfield")
    let primaryPos = position;
    if (position.includes("Midfield")) primaryPos = "Midfield";
    else if (position.includes("Forward") || position.includes("Winger") || position.includes("Striker") || position.includes("Attack")) primaryPos = "Attack";
    else if (position.includes("Back") || position.includes("Defender")) primaryPos = "Defender";
    else if (position.includes("Goalkeeper")) primaryPos = "Goalkeeper";

    const { data: peers, error } = await supabase
      .from("Player")
      .select(`
        id,
        fullName,
        commonName,
        position,
        subPosition,
        photoUrl,
        transfermarktId,
        dateOfBirth,
        latestMarketValue,
        currentClub:Club (
          name,
          logoUrl
        )
      `)
      .ilike("position", `%${primaryPos}%`)
      .order("latestMarketValue", { ascending: false, nullsFirst: false })
      .limit(limit + 5);

    if (error || !peers) {
      console.error("Error fetching positional peers:", error);
      return [];
    }

    const filtered = peers
      .filter((p: any) => p.id !== excludePlayerId && p.transfermarktId !== excludePlayerId)
      .slice(0, limit);

    return filtered.map((p: any, idx: number) => {
      const clubRaw = p.currentClub;
      const currentClub = Array.isArray(clubRaw) ? clubRaw[0] || null : clubRaw || null;

      return {
        id: p.id,
        fullName: p.fullName,
        commonName: p.commonName,
        slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.transfermarktId || p.id}`,
        position: p.position,
        subPosition: p.subPosition,
        dateOfBirth: p.dateOfBirth,
        photoUrl: sanitizeImageUrl(p.photoUrl, "player", p.transfermarktId || p.id),
        latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
        currentClub: currentClub
          ? {
              ...currentClub,
              logoUrl: sanitizeImageUrl(currentClub.logoUrl, "club"),
            }
          : null,
        rank: idx + 1,
      };
    });
  } catch (err) {
    console.error("Failed to fetch positional peers:", err);
    return [];
  }
}
