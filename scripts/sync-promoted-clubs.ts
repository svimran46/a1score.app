import { PrismaClient } from "@prisma/client";
import { tmGetClub } from "../src/lib/transfermarkt/client";
import { getLeagueStandings } from "../src/lib/fotmob/client";

const prisma = new PrismaClient();

// Promoted clubs to ensure exist in the database
const PROMOTED_CLUBS = [
  {
    name: "Coventry City",
    transfermarktId: "990",
    leagueCode: "GB1",
    country: "England",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/8669_small.png",
  },
  {
    name: "Deportivo de La Coruña",
    transfermarktId: "897",
    leagueCode: "ES1",
    country: "Spain",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/9783_small.png",
  },
  {
    name: "Racing Santander",
    transfermarktId: "630",
    leagueCode: "ES1",
    country: "Spain",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/8696_small.png",
  },
  {
    name: "SV 07 Elversberg",
    transfermarktId: "64",
    leagueCode: "L1",
    country: "Germany",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/8232_small.png",
  },
  {
    name: "Le Mans FC",
    transfermarktId: "1164",
    leagueCode: "FR1",
    country: "France",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/8682_small.png",
  },
  {
    name: "Académico Viseu FC",
    transfermarktId: "7788",
    leagueCode: "PO1",
    country: "Portugal",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/1786_small.png",
  },
  {
    name: "CF Estrela Amadora",
    transfermarktId: "2431",
    leagueCode: "PO1",
    country: "Portugal",
    logoUrl: "https://images.fotmob.com/image_resources/logo/teamlogo/1074320_small.png",
  },
];

async function main() {
  console.log("=== Syncing Promoted Clubs and Current Season Memberships ===");

  // 1. Fetch Leagues
  const leagues = await prisma.league.findMany();
  const leagueByCode = new Map(leagues.map((l) => [l.transfermarktId, l]));

  // 2. Ensure promoted clubs exist
  for (const p of PROMOTED_CLUBS) {
    const league = leagueByCode.get(p.leagueCode);
    if (!league) {
      console.warn(`League ${p.leagueCode} not found for ${p.name}`);
      continue;
    }

    const existing = await prisma.club.findFirst({
      where: {
        OR: [
          { transfermarktId: p.transfermarktId },
          { name: { contains: p.name, mode: "insensitive" } },
        ],
      },
    });

    if (!existing) {
      console.log(`Inserting missing club: ${p.name} (TM: ${p.transfermarktId}) into ${league.name}`);
      // Fetch initial valuation from TM if available
      let squadVal = BigInt(30000000); // 30M default if fetch fails
      let squadSize = 25;
      try {
        const tm = await tmGetClub(p.transfermarktId);
        if (tm && tm.totalSquadValue > 0) {
          squadVal = BigInt(tm.totalSquadValue);
          squadSize = tm.players?.length || 25;
        }
      } catch (err) {
        console.warn(`Could not fetch TM club ${p.transfermarktId}:`, err);
      }

      await prisma.club.create({
        data: {
          name: p.name,
          transfermarktId: p.transfermarktId,
          leagueId: league.id,
          country: p.country,
          logoUrl: p.logoUrl,
          totalMarketValue: squadVal,
          squadSize,
          lastSeason: 2026,
        },
      });
      console.log(`Created ${p.name} with value €${(Number(squadVal) / 1e6).toFixed(1)}M`);
    } else {
      console.log(`Club ${p.name} exists (${existing.id}), updating league to ${league.name}`);
      await prisma.club.update({
        where: { id: existing.id },
        data: {
          leagueId: league.id,
          lastSeason: 2026,
          transfermarktId: p.transfermarktId,
        },
      });
    }
  }

  // 3. Sync all 7 leagues standings from FotMob to mark active clubs for 2026
  const leagueConfigs = [
    { code: "GB1", fotmobId: 47 },
    { code: "ES1", fotmobId: 87 },
    { code: "IT1", fotmobId: 55 },
    { code: "L1", fotmobId: 54 },
    { code: "FR1", fotmobId: 53 },
    { code: "PO1", fotmobId: 61 },
    { code: "NL1", fotmobId: 57 },
  ];

  for (const cfg of leagueConfigs) {
    const league = leagueByCode.get(cfg.code);
    if (!league) continue;

    console.log(`\nFetching active standings for ${league.name} (FotMob ID: ${cfg.fotmobId})...`);
    const standings = await getLeagueStandings(cfg.fotmobId);
    if (!standings || !standings.standings) {
      console.warn(`No standings for ${league.name}`);
      continue;
    }

    const allClubs = await prisma.club.findMany();
    const activeClubIds: string[] = [];

    for (const team of standings.standings) {
      const cleanT = team.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanShort = (team.shortName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const matched = allClubs.find((c) => {
        const cleanC = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          cleanC === cleanT ||
          cleanC.includes(cleanT) ||
          cleanT.includes(cleanC) ||
          (cleanShort && (cleanC.includes(cleanShort) || cleanShort.includes(cleanC)))
        );
      });

      if (matched) {
        activeClubIds.push(matched.id);
        await prisma.club.update({
          where: { id: matched.id },
          data: {
            leagueId: league.id,
            lastSeason: 2026,
          },
        });
      } else {
        console.warn(`Unmatched team in ${league.name}: ${team.name} (FotMob ID: ${team.id})`);
      }
    }

    console.log(`Updated ${activeClubIds.length} active clubs for ${league.name}.`);

    // Any club previously in this league with lastSeason=2025 that is NOT in the 2026 standings is relegated!
    const relegated = await prisma.club.updateMany({
      where: {
        leagueId: league.id,
        id: { notIn: activeClubIds },
      },
      data: {
        lastSeason: 2025, // relegated / former
      },
    });
    console.log(`Marked ${relegated.count} clubs as relegated from ${league.name}.`);
  }

  console.log("\nSync complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
