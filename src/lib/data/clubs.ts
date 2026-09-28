import { supabase } from "@/lib/supabase";
import { tmGetClub } from "@/lib/transfermarkt/client";

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

    const squadWithValues = (club.players || []).map((p: any) => ({
      ...p,
      latestMarketValue: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
    }));

    const totalSquadValue = squadWithValues.reduce(
      (acc: number, curr: any) => acc + curr.latestMarketValue,
      0
    );

    return {
      ...club,
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
      logoUrl: club.logoUrl,
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
