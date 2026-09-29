import { supabase } from "@/lib/supabase";
import { tmGetClub } from "@/lib/transfermarkt/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";

export async function getClubById(id: string) {
  // 1. Try Transfermarkt live proxy for up-to-date squads and valuations
  try {
    const liveClub = await tmGetClub(id);
    if (liveClub && liveClub.players && liveClub.players.length > 0) {
      return liveClub;
    }
  } catch (proxyErr) {
    console.warn(`[Data Layer] TM Live Club fetch failed for ${id}, falling back to DB:`, proxyErr);
  }

  // 2. Fallback to Supabase Database
  try {
    const { data: club, error } = await supabase
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
          latestMarketValue
        )
      `)
      .or(`id.eq.${id},transfermarktId.eq.${id}`)
      .maybeSingle();

    if (error || !club) {
      console.error(`Error fetching club ${id}:`, error);
      return null;
    }

    const squadWithValues = (club.players || []).map((p: any) => {
      const extId = p.transfermarktId || p.id;
      return {
        ...p,
        sourceId: extId,
        slug: `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
        photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
        latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
      };
    });

    const totalSquadValue = squadWithValues.reduce(
      (acc: number, curr: any) => acc + curr.latestMarketValue,
      0
    );

    return {
      ...club,
      logoUrl: sanitizeImageUrl(club.logoUrl, "club", club.id),
      players: squadWithValues.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
      totalSquadValue: club.totalMarketValue ? Number(club.totalMarketValue) : totalSquadValue,
    };
  } catch (error) {
    console.error(`Error fetching club ${id}:`, error);
    return null;
  }
}

export async function getTopClubs(limit = 12) {
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
        league:League ( name )
      `)
      .order("totalMarketValue", { ascending: false, nullsFirst: false })
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

