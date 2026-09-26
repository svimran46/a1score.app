import { prisma } from "@/lib/prisma";

export async function getClubById(id: string) {
  try {
    const club = await prisma.club.findFirst({
      where: {
        OR: [{ id }, { transfermarktId: id }],
      },
      include: {
        league: true,
        players: {
          include: {
            marketValues: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!club) return null;

    // Calculate total squad market value
    const squadWithValues = club.players.map((p) => {
      const latestVal = p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0;
      return {
        ...p,
        latestMarketValue: latestVal,
      };
    });

    const totalSquadValue = squadWithValues.reduce((acc, curr) => acc + curr.latestMarketValue, 0);

    return {
      ...club,
      players: squadWithValues.sort((a, b) => b.latestMarketValue - a.latestMarketValue),
      totalSquadValue,
    };
  } catch (error) {
    console.error(`Error fetching club ${id}:`, error);
    return null;
  }
}

export async function getTopClubs(limit = 12) {
  try {
    const clubs = await prisma.club.findMany({
      take: limit,
      include: {
        league: true,
        players: {
          include: {
            marketValues: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return clubs
      .map((club) => {
        const squadValue = club.players.reduce((sum, p) => {
          const val = p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0;
          return sum + val;
        }, 0);
        return {
          id: club.id,
          name: club.name,
          logoUrl: club.logoUrl,
          country: club.country,
          leagueName: club.league?.name ?? null,
          playerCount: club.players.length,
          totalSquadValue: squadValue,
        };
      })
      .sort((a, b) => b.totalSquadValue - a.totalSquadValue);
  } catch (error) {
    console.error("Error fetching top clubs:", error);
    return [];
  }
}
