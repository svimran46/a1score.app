import { PrismaClient } from "@prisma/client";
import { getLeagueStandings } from "../src/lib/fotmob/client";

const prisma = new PrismaClient();

// Explicit FotMob team ID to canonical DB club name / TM ID mapping
export const FOTMOB_TEAM_MAPPINGS: Record<number, { name?: string; tmId?: string }> = {
  // LaLiga
  9906: { name: "Atlético de Madrid", tmId: "13" },
  9783: { name: "Deportivo de La Coruña", tmId: "897" },
  8315: { name: "Athletic Bilbao", tmId: "621" },
  9910: { name: "Celta de Vigo", tmId: "940" },
  8696: { name: "Racing Santander", tmId: "630" },
  // Bundesliga
  9823: { name: "Bayern Munich", tmId: "27" },
  8232: { name: "SV 07 Elversberg", tmId: "64" },
  // Ligue 1
  9851: { name: "Stade Rennais FC", tmId: "273" },
  8682: { name: "Le Mans FC", tmId: "1164" },
  // Liga Portugal
  1074320: { name: "CF Estrela Amadora", tmId: "2431" },
  7844: { name: "Vitória Guimarães SC", tmId: "2420" },
  1786: { name: "Académico Viseu FC", tmId: "7788" },
  // Premier League
  8669: { name: "Coventry City", tmId: "990" },
  8667: { name: "Hull City", tmId: "3008" },
  9902: { name: "Ipswich Town", tmId: "677" },
};

async function main() {
  console.log("=== Updating Aliases and Finalizing League Membership ===");

  const leagues = await prisma.league.findMany();
  const leagueByCode = new Map(leagues.map((l) => [l.transfermarktId, l]));

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

    const standings = await getLeagueStandings(cfg.fotmobId);
    if (!standings || !standings.standings) continue;

    const allClubs = await prisma.club.findMany();
    const activeClubIds: string[] = [];

    for (const team of standings.standings) {
      // Check explicit mapping first
      let matched = null;
      if (FOTMOB_TEAM_MAPPINGS[team.id]) {
        const target = FOTMOB_TEAM_MAPPINGS[team.id];
        matched = allClubs.find(
          (c) =>
            (target.tmId && c.transfermarktId === target.tmId) ||
            (target.name && c.name.toLowerCase() === target.name.toLowerCase())
        );
      }

      if (!matched) {
        const cleanT = team.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanShort = (team.shortName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        matched = allClubs.find((c) => {
          const cleanC = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            cleanC === cleanT ||
            cleanC.includes(cleanT) ||
            cleanT.includes(cleanC) ||
            (cleanShort && (cleanC.includes(cleanShort) || cleanShort.includes(cleanC)))
          );
        });
      }

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
        console.warn(`STILL UNMATCHED: ${team.name} (${team.id}) in ${league.name}`);
      }
    }

    console.log(`League: ${league.name} -> ${activeClubIds.length} / ${standings.standings.length} teams active.`);
  }

  console.log("Done updating aliases!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
