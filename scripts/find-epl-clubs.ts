import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

const EPL_NAMES = [
  "Arsenal",
  "Aston Villa",
  "AFC Bournemouth",
  "Brentford",
  "Brighton & Hove Albion",
  "Chelsea",
  "Coventry City",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Hull City",
  "Ipswich Town",
  "Leeds United",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Sunderland",
  "Tottenham Hotspur",
];

async function main() {
  const allClubs = await prisma.club.findMany({
    include: { league: true },
  });

  console.log(`Loaded ${allClubs.length} clubs from database.`);

  const fotmobByClubId = new Map<string, number>();
  const fotmobByTmId = new Map<string, number>();
  for (const [fmIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fmIdStr);
    if (m.clubId) fotmobByClubId.set(m.clubId, fId);
    if (m.tmId) fotmobByTmId.set(m.tmId, fId);
  }

  for (const name of EPL_NAMES) {
    const matches = allClubs.filter(
      (c) =>
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(c.name.toLowerCase())
    );

    console.log(`\n--- Query for "${name}" ---`);
    for (const m of matches) {
      const fmId = fotmobByClubId.get(m.id) || (m.transfermarktId ? fotmobByTmId.get(m.transfermarktId) : null);
      console.log(
        JSON.stringify({
          id: m.id,
          name: m.name,
          tmId: m.transfermarktId,
          league: m.league?.name,
          fotmobId: fmId,
        })
      );
    }
  }
}

main().finally(() => prisma.$disconnect());
