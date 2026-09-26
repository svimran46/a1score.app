import { supabase } from "@/lib/supabase";

export async function getClubById(id: string) {
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
          marketValues:MarketValueHistory (
            valueEur,
            date
          )
        )
      `)
      .or(`id.eq.${id},transfermarktId.eq.${id}`)
      .maybeSingle();

    if (error || !club) {
      console.error(`Error fetching club ${id}:`, error);
      return null;
    }

    const squadWithValues = (club.players || []).map((p: any) => {
      const sortedValues = [...(p.marketValues || [])].sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestVal = sortedValues[0]?.valueEur ? Number(sortedValues[0].valueEur) : 0;
      return {
        ...p,
        latestMarketValue: latestVal,
      };
    });

    const totalSquadValue = squadWithValues.reduce(
      (acc: number, curr: any) => acc + curr.latestMarketValue,
      0
    );

    return {
      ...club,
      players: squadWithValues.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
      totalSquadValue,
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
        league:League ( name ),
        players:Player (
          id,
          marketValues:MarketValueHistory ( valueEur, date )
        )
      `)
      .limit(limit);

    if (error || !clubs) {
      console.error("Error fetching top clubs:", error);
      return [];
    }

    return clubs
      .map((club: any) => {
        const squadValue = (club.players || []).reduce((sum: number, p: any) => {
          const val = p.marketValues?.[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0;
          return sum + val;
        }, 0);
        return {
          id: club.id,
          name: club.name,
          logoUrl: club.logoUrl,
          country: club.country,
          leagueName: club.league?.name ?? null,
          playerCount: club.players?.length ?? 0,
          totalSquadValue: squadValue,
        };
      })
      .sort((a: any, b: any) => b.totalSquadValue - a.totalSquadValue);
  } catch (error) {
    console.error("Error fetching top clubs:", error);
    return [];
  }
}
