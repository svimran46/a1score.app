import { prisma } from "@/lib/prisma";

export async function getLeagues() {
  try {
    const leagues = await prisma.league.findMany({
      include: {
        clubs: {
          include: {
            players: {
              include: {
                marketValues: {
                  orderBy: { date: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { tier: "asc" },
    });

    return leagues.map((league) => {
      let leagueValue = 0;
      let totalPlayers = 0;

      league.clubs.forEach((c) => {
        totalPlayers += c.players.length;
        c.players.forEach((p) => {
          leagueValue += p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0;
        });
      });

      return {
        id: league.id,
        name: league.name,
        country: league.country,
        tier: league.tier,
        logoUrl: league.logoUrl,
        clubCount: league.clubs.length,
        totalPlayers,
        totalMarketValue: leagueValue,
      };
    });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export async function getLeagueById(id: string) {
  try {
    const league = await prisma.league.findFirst({
      where: {
        OR: [{ id }, { transfermarktId: id }],
      },
      include: {
        clubs: {
          include: {
            players: {
              include: {
                marketValues: {
                  orderBy: { date: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!league) return null;

    // Rank clubs by total squad value
    const rankedClubs = league.clubs.map((club) => {
      const squadVal = club.players.reduce((sum, p) => {
        return sum + (p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0);
      }, 0);
      return {
        ...club,
        squadSize: club.players.length,
        totalSquadValue: squadVal,
      };
    }).sort((a, b) => b.totalSquadValue - a.totalSquadValue);

    return {
      ...league,
      clubs: rankedClubs,
    };
  } catch (error) {
    console.error(`Error fetching league ${id}:`, error);
    return null;
  }
}
