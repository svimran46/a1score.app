import { prisma } from "@/lib/prisma";

export async function getMostValuablePlayers(limit = 10) {
  try {
    const players = await prisma.player.findMany({
      take: limit,
      include: {
        currentClub: {
          select: { id: true, name: true, logoUrl: true, league: { select: { name: true } } },
        },
        marketValues: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: {
        marketValues: {
          _count: "desc",
        },
      },
    });

    // Sort by latest market value
    return players
      .map((p) => ({
        ...p,
        latestMarketValue: p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0,
      }))
      .sort((a, b) => b.latestMarketValue - a.latestMarketValue);
  } catch (error) {
    console.error("Error fetching most valuable players:", error);
    return [];
  }
}

export async function getPlayerBySlugOrId(slugOrId: string) {
  try {
    // Slugs are formatted as [name]-[transfermarktId] e.g. erling-haaland-418560
    const parts = slugOrId.split("-");
    const possibleTmId = parts[parts.length - 1];

    let player = await prisma.player.findFirst({
      where: {
        OR: [
          { id: slugOrId },
          { transfermarktId: possibleTmId },
          { transfermarktId: slugOrId },
        ],
      },
      include: {
        currentClub: {
          include: {
            league: true,
          },
        },
        marketValues: {
          orderBy: { date: "asc" },
        },
        seasonStats: {
          orderBy: { season: "desc" },
        },
        transfers: {
          orderBy: { date: "desc" },
        },
        injuries: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!player) return null;

    // Convert BigInt to Number for serialization
    return {
      ...player,
      marketValues: player.marketValues.map((mv) => ({
        ...mv,
        valueEur: Number(mv.valueEur),
      })),
      transfers: player.transfers.map((t) => ({
        ...t,
        feeEur: t.feeEur ? Number(t.feeEur) : null,
      })),
    };
  } catch (error) {
    console.error(`Error fetching player ${slugOrId}:`, error);
    return null;
  }
}

export async function searchPlayers(query: string, options: { position?: string; clubId?: string; limit?: number } = {}) {
  const { position, clubId, limit = 20 } = options;
  try {
    const players = await prisma.player.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { fullName: { contains: query, mode: "insensitive" } },
                  { commonName: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          position ? { position: { equals: position, mode: "insensitive" } } : {},
          clubId ? { currentClubId: clubId } : {},
        ],
      },
      take: limit,
      include: {
        currentClub: {
          include: { league: true },
        },
        marketValues: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    return players.map((p) => ({
      ...p,
      latestMarketValue: p.marketValues[0]?.valueEur ? Number(p.marketValues[0].valueEur) : 0,
    }));
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}
