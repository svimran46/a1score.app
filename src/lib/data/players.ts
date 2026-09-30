import { supabase } from "@/lib/supabase";
import {
  tmGetMostValuablePlayers,
  tmGetPlayer,
  tmSearchPlayers,
} from "@/lib/transfermarkt/client";
import { getFotmobPlayerStats } from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";

import { getCanonicalPosition } from "@/lib/positions";

export async function getMostValuablePlayers(limit = 40, positionFilter?: string) {
  // Fetch DB clubs to map TM club IDs to canonical DB club IDs
  let dbClubsMap = new Map<string, any>();
  try {
    const { data: dbClubs } = await supabase.from("Club").select("id, name, transfermarktId, logoUrl");
    if (dbClubs) {
      dbClubs.forEach((c) => {
        if (c.transfermarktId) dbClubsMap.set(c.transfermarktId, c);
        dbClubsMap.set(c.name.toLowerCase(), c);
      });
    }
  } catch (e) {
    console.warn("Could not preload DB clubs for player mapping:", e);
  }

  // 1. First, attempt to fetch live worldwide rankings directly via Transfermarkt proxy
  try {
    const liveRanking = await tmGetMostValuablePlayers(limit, positionFilter);
    if (liveRanking && liveRanking.length > 0) {
      return liveRanking.slice(0, limit).map((p: any) => {
        const tmClubId = p.currentClub?.transfermarktId || p.currentClub?.id;
        const matchedClub =
          (tmClubId && dbClubsMap.get(tmClubId)) ||
          (p.currentClub?.name && dbClubsMap.get(p.currentClub.name.toLowerCase()));

        const canonicalClubId = matchedClub?.id || p.currentClub?.id || "unknown";
        const canonicalClubName = matchedClub?.name || p.currentClub?.name || "Unknown Club";
        const canonicalClubLogo = matchedClub?.logoUrl
          ? sanitizeImageUrl(matchedClub.logoUrl, "club", matchedClub.id)
          : p.currentClub?.logoUrl;

        const canonicalPos = getCanonicalPosition(p.position);

        return {
          ...p,
          position: canonicalPos.detailed,
          positionGroup: canonicalPos.group,
          canonicalPosition: canonicalPos,
          currentClub: p.currentClub
            ? {
                ...p.currentClub,
                id: canonicalClubId,
                name: canonicalClubName,
                logoUrl: canonicalClubLogo,
              }
            : null,
        };
      });
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
        lastSeason,
        currentClub:Club (
          id,
          name,
          logoUrl,
          league:League ( name )
        )
      `)
      .not("currentClubId", "is", null)
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
      const canonicalPos = getCanonicalPosition(p.subPosition || p.position);
      return {
        ...p,
        sourceId: extId,
        slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
        photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
        latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
        position: canonicalPos.detailed,
        positionGroup: canonicalPos.group,
        canonicalPosition: canonicalPos,
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
  if (!slugOrId) return null;

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
        } catch {
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
    // Extract any trailing numeric ID from the slug (e.g. 'd-sir-dou--914562' -> '914562')
    const numericMatch = slugOrId.match(/\d+$/);
    const numericId = numericMatch ? numericMatch[0] : null;

    // Clean alphanumeric slug for sanitized searching
    const sanitizedId = slugOrId.replace(/[^a-zA-Z0-9_-]/g, "");

    let queryBuilder = supabase
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
      `);

    // Match by numeric transfermarktId, internal ID, or exact transfermarktId
    if (numericId && numericId === sanitizedId) {
      queryBuilder = queryBuilder.or(`transfermarktId.eq.${numericId},id.eq.${sanitizedId}`);
    } else if (numericId) {
      queryBuilder = queryBuilder.or(`transfermarktId.eq.${numericId},id.eq.${sanitizedId}`);
    } else if (sanitizedId) {
      queryBuilder = queryBuilder.or(`id.eq.${sanitizedId},transfermarktId.eq.${sanitizedId}`);
    } else {
      return null;
    }

    let { data: player, error } = await queryBuilder.maybeSingle();

    // Secondary fallback: if ID lookup failed, search by name derived from slug
    if ((error || !player) && slugOrId.includes("-")) {
      const nameParts = slugOrId.replace(/-\d+$/, "").replace(/--+/g, "-").split("-").filter(Boolean);
      if (nameParts.length > 0) {
        const nameGuess = nameParts.join(" ");
        const playerSelectFields = `
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
        `;

        // 1. Direct case-insensitive match
        const { data: nameMatch } = await supabase
          .from("Player")
          .select(playerSelectFields)
          .ilike("fullName", `%${nameGuess}%`)
          .order("latestMarketValue", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (nameMatch) {
          player = nameMatch;
        } else {
          // 2. Flexible token/accent matching:
          // Replace vowels with single-character wildcard '_' to bridge accented characters
          // (e.g. 'mbappe' -> 'mb_pp_', which matches 'Mbappé', or 'kylian' & 'mbappe' -> '%kylian%mbapp%')
          const wildcardTokens = nameParts.map((p) => p.replace(/[aeiouy]/gi, "_"));
          const joinedPattern = wildcardTokens.join("%");

          let { data: accentMatch } = await supabase
            .from("Player")
            .select(playerSelectFields)
            .ilike("fullName", `%${joinedPattern}%`)
            .order("latestMarketValue", { ascending: false })
            .limit(1)
            .maybeSingle();

          // 3. If still not found, try matching by the longest distinctive name part (e.g. surname 'mbappe' or 'haaland')
          if (!accentMatch) {
            const sortedParts = [...nameParts].sort((a, b) => b.length - a.length);
            for (const part of sortedParts) {
              if (part.length >= 4) {
                const partPattern = part.replace(/[aeiouy]/gi, "_");
                const { data: singleMatch } = await supabase
                  .from("Player")
                  .select(playerSelectFields)
                  .ilike("fullName", `%${partPattern}%`)
                  .order("latestMarketValue", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (singleMatch) {
                  accentMatch = singleMatch;
                  break;
                }
              }
            }
          }

          if (accentMatch) {
            player = accentMatch;
          }
        }
      }
    }

    if (!player) {
      return null;
    }

    // Sort market values chronologically (asc) for charts, filtering out invalid dates
    const sortedMarketValues = (player.marketValues || [])
      .filter((mv: any) => mv && mv.date && !isNaN(new Date(mv.date).getTime()))
      .map((mv: any) => ({
        ...mv,
        valueEur: Number(mv.valueEur) || 0,
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sort transfers chronologically (desc), safely handling null/invalid dates
    const sortedTransfers = (player.transfers || [])
      .map((t: any) => ({
        ...t,
        feeEur: t.feeEur ? Number(t.feeEur) : null,
      }))
      .sort((a: any, b: any) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

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
    const safeDob = player.dateOfBirth && !isNaN(new Date(player.dateOfBirth).getTime()) ? player.dateOfBirth : null;

    return {
      ...player,
      sourceId: extId,
      fullName: player.fullName || "Player Profile",
      commonName: player.commonName || player.fullName || "Player Profile",
      dateOfBirth: safeDob,
      nationality: Array.isArray(player.nationality)
        ? player.nationality
        : typeof player.nationality === "string" && player.nationality
        ? [player.nationality]
        : [],
      position: player.position || "Unknown",
      subPosition: player.subPosition || null,
      preferredFoot: player.preferredFoot || null,
      heightCm: player.heightCm ? Number(player.heightCm) : null,
      slug: `${(player.fullName || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
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
    console.error(`Error fetching player ${slugOrId} from DB:`, error);
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
  if (!position) return [];

  try {
    // Simplify position to primary category if needed (e.g. "Central Midfield" -> "Midfield")
    let primaryPos = String(position);
    if (primaryPos.includes("Midfield")) primaryPos = "Midfield";
    else if (primaryPos.includes("Forward") || primaryPos.includes("Winger") || primaryPos.includes("Striker") || primaryPos.includes("Attack")) primaryPos = "Attack";
    else if (primaryPos.includes("Back") || primaryPos.includes("Defender")) primaryPos = "Defender";
    else if (primaryPos.includes("Goalkeeper")) primaryPos = "Goalkeeper";

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
      console.warn("Error fetching positional peers:", error?.message || error);
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
