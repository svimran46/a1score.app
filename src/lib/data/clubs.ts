import { supabase } from "@/lib/supabase";
import { tmGetClub } from "@/lib/transfermarkt/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { getCanonicalPosition } from "@/lib/positions";

/**
 * Extracts possible identifiers (CUID, TM ID, slug) from an input string.
 */
export function extractClubIdentifiers(idOrSlug: string) {
  const raw = (idOrSlug || "").trim();
  const cuidMatch = raw.match(/c[a-z0-9]{24}/i);
  const cuid = cuidMatch ? cuidMatch[0] : null;

  // Numeric TM ID at the end or standalone
  const numMatch = raw.match(/\b\d+\b/);
  const tmId = numMatch ? numMatch[0] : null;

  return { raw, cuid, tmId };
}

export async function getClubById(idOrSlug: string) {
  if (!idOrSlug) return null;

  const { raw, cuid, tmId } = extractClubIdentifiers(idOrSlug);

  // 1. Resolve canonical club record from DB
  let dbClub: any = null;
  try {
    let query = supabase
      .from("Club")
      .select(`
        *,
        league:League ( * ),
        players:Player (
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
          lastSeason
        )
      `);

    if (cuid) {
      query = query.or(`id.eq.${cuid},transfermarktId.eq.${raw}`);
    } else if (tmId) {
      query = query.or(`transfermarktId.eq.${tmId},id.eq.${raw}`);
    } else {
      query = query.or(`id.eq.${raw},transfermarktId.eq.${raw}`);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      dbClub = data;
    }
  } catch (dbErr) {
    console.warn(`[Data Layer] Error resolving club ${idOrSlug} from DB:`, dbErr);
  }

  const effectiveTmId = dbClub?.transfermarktId || tmId || (idOrSlug.match(/^\d+$/) ? idOrSlug : null);
  const canonicalId = dbClub?.id || idOrSlug;
  const canonicalName = dbClub?.name || "Club";
  const canonicalLogo = dbClub?.logoUrl
    ? sanitizeImageUrl(dbClub.logoUrl, "club", canonicalId)
    : effectiveTmId
    ? sanitizeImageUrl(`https://img.a.transfermarkt.technology/wappen/head/${effectiveTmId}.png`, "club", effectiveTmId)
    : null;

  // 2. Try Transfermarkt live squad proxy for current first team roster and valuations
  if (effectiveTmId) {
    try {
      const liveClub = await tmGetClub(effectiveTmId);
      if (liveClub && liveClub.players && liveClub.players.length > 0) {
        const livePlayers = liveClub.players.map((p: any) => {
          const extId = p.sourceId || p.id;
          const canonicalPos = getCanonicalPosition(p.position);
          return {
            ...p,
            sourceId: extId,
            slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
            photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
            position: canonicalPos.detailed,
            positionGroup: canonicalPos.group,
            canonicalPosition: canonicalPos,
            latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
            tier: p.tier || ((p.latestMarketValue && p.latestMarketValue > 0) || (p.age && p.age >= 20) ? "first_team" : "academy"),
          };
        });

        const firstTeam = livePlayers.filter((p: any) => p.tier === "first_team");
        const academy = livePlayers.filter((p: any) => p.tier === "academy");
        const squadToUse = firstTeam.length > 0 ? firstTeam : livePlayers;

        const totalSquadValue = squadToUse.reduce(
          (sum: number, p: any) => sum + (p.latestMarketValue || 0),
          0
        );

        const ages = squadToUse.map((p: any) => p.age).filter((a: any): a is number => typeof a === "number" && a > 0);
        const averageAge = ages.length > 0 ? (ages.reduce((s: number, a: number) => s + a, 0) / ages.length).toFixed(1) : null;

        return {
          id: canonicalId,
          sourceId: effectiveTmId,
          transfermarktId: effectiveTmId,
          name: canonicalName,
          logoUrl: canonicalLogo,
          country: dbClub?.country || null,
          league: dbClub?.league
            ? {
                ...dbClub.league,
                logoUrl: sanitizeImageUrl(dbClub.league.logoUrl, "league", dbClub.league.id),
              }
            : null,
          totalSquadValue,
          totalMarketValue: totalSquadValue,
          squadSize: squadToUse.length,
          averageAge,
          players: livePlayers,
          firstTeamPlayers: squadToUse,
          academyPlayers: academy,
        };
      }
    } catch (proxyErr) {
      console.warn(`[Data Layer] TM Live Club fetch failed for ${effectiveTmId}, falling back to DB:`, proxyErr);
    }
  }

  // 3. Fallback to Supabase Database (strictly filtered to active players, lastSeason >= 2025)
  if (!dbClub) {
    return null;
  }

  const rawDbPlayers = (dbClub.players || []).filter(
    (p: any) => p.lastSeason === null || p.lastSeason >= 2025
  );

  const squadWithValues = rawDbPlayers.map((p: any) => {
    const extId = p.transfermarktId || p.id;
    const canonicalPos = getCanonicalPosition(p.subPosition || p.position);
    const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : null;
    const age = birthYear ? 2026 - birthYear : null;
    const val = p.latestMarketValue ? Number(p.latestMarketValue) : 0;
    const tier = (val > 0 || (age !== null && age >= 20)) ? "first_team" : "academy";

    return {
      ...p,
      sourceId: extId,
      slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
      photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
      position: canonicalPos.detailed,
      positionGroup: canonicalPos.group,
      canonicalPosition: canonicalPos,
      latestMarketValue: val,
      age,
      contractUntil: null,
      tier,
    };
  });

  const firstTeam = squadWithValues.filter((p: any) => p.tier === "first_team");
  const academy = squadWithValues.filter((p: any) => p.tier === "academy");
  const squadToUse = firstTeam.length > 0 ? firstTeam : squadWithValues;

  const totalSquadValue = squadToUse.reduce(
    (acc: number, curr: any) => acc + curr.latestMarketValue,
    0
  );

  const ages = squadToUse.map((p: any) => p.age).filter((a: any): a is number => typeof a === "number" && a > 0);
  const averageAge = ages.length > 0 ? (ages.reduce((s: number, a: number) => s + a, 0) / ages.length).toFixed(1) : null;

  return {
    ...dbClub,
    id: dbClub.id,
    name: dbClub.name,
    logoUrl: sanitizeImageUrl(dbClub.logoUrl, "club", dbClub.id),
    league: dbClub.league
      ? {
          ...dbClub.league,
          logoUrl: sanitizeImageUrl(dbClub.league.logoUrl, "league", dbClub.league.id),
        }
      : null,
    players: squadWithValues.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    firstTeamPlayers: squadToUse.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    academyPlayers: academy.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    totalSquadValue,
    totalMarketValue: totalSquadValue,
    squadSize: squadToUse.length,
    averageAge,
  };
}

export async function getTopClubs(limit = 24) {
  try {
    const { data: clubs, error } = await supabase
      .from("Club")
      .select(`
        id,
        name,
        logoUrl,
        country,
        squadSize,
        totalMarketValue,
        lastSeason,
        league:League ( id, name )
      `)
      .order("totalMarketValue", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(limit);

    if (error || !clubs) {
      console.error("Error fetching top clubs:", error);
      return [];
    }

    return clubs.map((club: any) => ({
      id: club.id,
      name: club.name,
      logoUrl: sanitizeImageUrl(club.logoUrl, "club", club.id),
      country: club.country,
      leagueName: club.league?.name ?? null,
      leagueId: club.league?.id ?? null,
      playerCount: club.squadSize ?? 0,
      totalSquadValue: club.totalMarketValue ? Number(club.totalMarketValue) : 0,
    }));
  } catch (error) {
    console.error("Error fetching top clubs:", error);
    return [];
  }
}

export async function getClubTransfers(clubName: string) {
  if (!clubName) {
    return { recordArrivals: [], recordDepartures: [] };
  }

  // Clean common club prefixes/suffixes to match transfer records
  const cleanName = clubName
    .replace(/^(FC|CF|AC|AS|SSC|AFC|BSC|RCD|RC)\s+/i, "")
    .replace(/\s+(FC|CF|AFC|BSC|SAD)$/i, "")
    .trim();

  try {
    const [arrivalsRes, departuresRes] = await Promise.all([
      supabase
        .from("Transfer")
        .select(`
          id,
          fromClubName,
          toClubName,
          date,
          feeEur,
          transferType,
          player:Player (
            id,
            fullName,
            commonName,
            photoUrl,
            position,
            transfermarktId
          )
        `)
        .ilike("toClubName", `%${cleanName}%`)
        .order("feeEur", { ascending: false, nullsFirst: false })
        .limit(8),

      supabase
        .from("Transfer")
        .select(`
          id,
          fromClubName,
          toClubName,
          date,
          feeEur,
          transferType,
          player:Player (
            id,
            fullName,
            commonName,
            photoUrl,
            position,
            transfermarktId
          )
        `)
        .ilike("fromClubName", `%${cleanName}%`)
        .order("feeEur", { ascending: false, nullsFirst: false })
        .limit(8),
    ]);

    const formatTransfers = (list: any[]) =>
      (list || []).map((t) => {
        const rawP = Array.isArray(t.player) ? t.player[0] : t.player;
        const extId = rawP ? (rawP.transfermarktId || rawP.id) : null;
        const player = rawP
          ? {
              ...rawP,
              sourceId: extId,
              slug: `${rawP.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
              photoUrl: sanitizeImageUrl(rawP.photoUrl, "player", extId),
            }
          : null;

        return {
          id: t.id,
          fromClubName: t.fromClubName,
          toClubName: t.toClubName,
          date: t.date,
          feeEur: t.feeEur !== null && t.feeEur !== undefined ? Number(t.feeEur) : null,
          transferType: t.transferType,
          player,
        };
      });

    return {
      recordArrivals: formatTransfers(arrivalsRes.data || []),
      recordDepartures: formatTransfers(departuresRes.data || []),
    };
  } catch (err) {
    console.error(`[Data Layer] Error fetching transfers for club ${clubName}:`, err);
    return { recordArrivals: [], recordDepartures: [] };
  }
}

