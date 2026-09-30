import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Cleaning Rosters & Recomputing Aggregates ===");

  // 1. Remove former/retired players (lastSeason < 2025) from currentClubId
  const formerResult = await prisma.player.updateMany({
    where: {
      lastSeason: { lt: 2025 },
      currentClubId: { not: null },
    },
    data: {
      currentClubId: null,
    },
  });
  console.log(`Detached ${formerResult.count} former/retired players from club rosters.`);

  // 2. Update specific transferred players to their verified clubs and valuations
  // Find clubs
  const manCity = await prisma.club.findFirst({ where: { name: "Manchester City" } });
  const chelsea = await prisma.club.findFirst({ where: { name: "Chelsea FC" } });
  const realMadrid = await prisma.club.findFirst({ where: { name: { contains: "Real Madrid" } } });
  const fenerbahce = await prisma.club.findFirst({ where: { name: { contains: "Fenerbah" } } });
  const galatasaray = await prisma.club.findFirst({ where: { name: { contains: "Galatasaray" } } });
  const sheffUtd = await prisma.club.findFirst({ where: { name: { contains: "Sheffield United" } } });

  // Update Erling Haaland -> €220M
  await prisma.player.updateMany({
    where: { fullName: { contains: "Haaland" } },
    data: {
      latestMarketValue: BigInt(220000000),
      currentClubId: manCity?.id,
      lastSeason: 2026,
    },
  });
  console.log("Updated Haaland -> €220M at Manchester City");

  // Update Elliot Anderson -> €110M at Man City
  if (manCity) {
    await prisma.player.updateMany({
      where: { fullName: { contains: "Elliot Anderson" } },
      data: {
        currentClubId: manCity.id,
        latestMarketValue: BigInt(110000000),
        lastSeason: 2026,
      },
    });
    console.log("Updated Elliot Anderson -> €110M at Manchester City");

    // Update Enzo Fernández -> €100M at Man City
    await prisma.player.updateMany({
      where: { fullName: { contains: "Enzo Fern" } },
      data: {
        currentClubId: manCity.id,
        latestMarketValue: BigInt(100000000),
        lastSeason: 2026,
      },
    });
    console.log("Updated Enzo Fernández -> €100M at Manchester City");
  }

  // Update Morgan Rogers -> €110M at Chelsea FC
  if (chelsea) {
    await prisma.player.updateMany({
      where: { fullName: { contains: "Morgan Rogers" } },
      data: {
        currentClubId: chelsea.id,
        latestMarketValue: BigInt(110000000),
        lastSeason: 2026,
      },
    });
    console.log("Updated Morgan Rogers -> €110M at Chelsea FC");
  }

  // Update Ederson -> Fenerbahce (or null if club not in DB)
  await prisma.player.updateMany({
    where: { fullName: "Ederson", dateOfBirth: { lte: new Date("1994-01-01") } },
    data: {
      currentClubId: fenerbahce?.id || null,
      lastSeason: 2026,
    },
  });

  // Update Kalvin Phillips -> Sheffield United
  await prisma.player.updateMany({
    where: { fullName: { contains: "Kalvin Phillips" } },
    data: {
      currentClubId: sheffUtd?.id || null,
      lastSeason: 2026,
    },
  });

  // Update Ilkay Gundogan -> Galatasaray
  await prisma.player.updateMany({
    where: { fullName: { contains: "Gündoğan" } },
    data: {
      currentClubId: galatasaray?.id || null,
      lastSeason: 2026,
    },
  });

  // Update Bernardo Silva -> Real Madrid
  if (realMadrid) {
    await prisma.player.updateMany({
      where: { fullName: { contains: "Bernardo Silva" } },
      data: {
        currentClubId: realMadrid.id,
        lastSeason: 2026,
      },
    });
  }

  // 3. Recompute Club squadSize and totalMarketValue for all clubs
  console.log("\nRecomputing Club squad sizes and totalMarketValues...");
  const clubs = await prisma.club.findMany({
    include: {
      players: {
        select: {
          id: true,
          latestMarketValue: true,
          dateOfBirth: true,
        },
      },
    },
  });

  for (const c of clubs) {
    const totalVal = c.players.reduce(
      (sum, p) => sum + (p.latestMarketValue ? BigInt(p.latestMarketValue) : BigInt(0)),
      BigInt(0)
    );
    const squadSize = c.players.length;

    await prisma.club.update({
      where: { id: c.id },
      data: {
        totalMarketValue: totalVal,
        squadSize: squadSize,
      },
    });
  }
  console.log(`Recomputed totals for ${clubs.length} clubs.`);

  // 4. Recompute League aggregates for all leagues
  console.log("\nRecomputing League aggregates for active season (lastSeason = 2026)...");
  const leagues = await prisma.league.findMany({
    include: {
      clubs: {
        where: { lastSeason: 2026 },
        include: {
          players: {
            select: { id: true, latestMarketValue: true },
          },
        },
      },
    },
  });

  for (const l of leagues) {
    const clubCount = l.clubs.length;
    let totalPlayers = 0;
    let totalMarketValue = BigInt(0);

    for (const c of l.clubs) {
      totalPlayers += c.players.length;
      totalMarketValue += c.totalMarketValue ? BigInt(c.totalMarketValue) : BigInt(0);
    }

    await prisma.league.update({
      where: { id: l.id },
      data: {
        clubCount,
        totalPlayers,
        totalMarketValue,
      },
    });

    console.log(
      `League: ${l.name} -> ${clubCount} clubs, ${totalPlayers} players, €${(Number(totalMarketValue) / 1e9).toFixed(2)}B total value`
    );
  }

  console.log("\nDone cleaning rosters and recomputing aggregates!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
