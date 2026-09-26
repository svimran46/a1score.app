import { supabase } from "@/lib/supabase";

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
        clubs:Club ( id, name, logoUrl )
      `)
      .order("tier", { ascending: true });

    if (error || !leagues) {
      console.error("Error fetching leagues:", error);
      return [];
    }

    return leagues.map((league) => ({
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      logoUrl: league.logoUrl,
      clubCount: league.clubs?.length ?? 0,
      totalPlayers: (league.clubs?.length ?? 0) * 25,
      totalMarketValue: (league.clubs?.length ?? 0) * 50_000_000,
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
        clubs:Club (
          id,
          name,
          logoUrl,
          country,
          players:Player (
            id,
            marketValues:MarketValueHistory ( valueEur )
          )
        )
      `)
      .or(`id.eq.${id},transfermarktId.eq.${id}`)
      .maybeSingle();

    if (error || !league) {
      console.error(`Error fetching league ${id}:`, error);
      return null;
    }

    const rankedClubs = (league.clubs || [])
      .map((club: any) => {
        const squadVal = (club.players || []).reduce((sum: number, p: any) => {
          const val = p.marketValues?.[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0;
          return sum + val;
        }, 0);
        return {
          id: club.id,
          name: club.name,
          logoUrl: club.logoUrl,
          country: club.country,
          squadSize: club.players?.length ?? 0,
          totalSquadValue: squadVal,
        };
      })
      .sort((a: any, b: any) => b.totalSquadValue - a.totalSquadValue);

    return {
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      logoUrl: league.logoUrl,
      transfermarktId: league.transfermarktId,
      clubs: rankedClubs,
    };
  } catch (error) {
    console.error(`Error fetching league ${id}:`, error);
    return null;
  }
}
