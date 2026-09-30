import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) throw new Error("No DIRECT_URL or DATABASE_URL");
const pool = new Pool({
  connectionString: directUrl.replace(/[?&]sslmode=[^&]*/, ""),
  ssl: { rejectUnauthorized: false },
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clubs = await prisma.club.findMany({
    where: { players: { some: {} } },
    select: {
      id: true,
      name: true,
      squadSize: true,
      totalMarketValue: true,
      lastSeason: true,
      lastSyncedAt: true,
      squadSource: true,
      _count: { select: { players: true } },
      players: {
        select: {
          id: true,
          fullName: true,
          position: true,
          dateOfBirth: true,
          nationality: true,
          latestMarketValue: true,
          status: true,
          transfermarktId: true,
        },
      },
    },
    take: 10,
  });

  console.log("Sample 10 clubs with players in DB:");
  console.table(
    clubs.map((c) => {
      const sumMarketVal = c.players.reduce((sum, p) => sum + (p.latestMarketValue ? BigInt(p.latestMarketValue) : 0n), 0n);
      return {
        Club: c.name,
        dbSquadSizeField: c.squadSize,
        actualPlayersCount: c._count.players,
        dbTotalMarketValue: c.totalMarketValue ? `€${(Number(c.totalMarketValue) / 1e6).toFixed(1)}M` : "0",
        computedPlayersSum: `€${(Number(sumMarketVal) / 1e6).toFixed(1)}M`,
        lastSyncedAt: c.lastSyncedAt?.toISOString()?.slice(0, 10) || "null",
        squadSource: c.squadSource,
      };
    })
  );

  // Check players missing critical fields across all audited clubs
  const allAuditedPlayers = await prisma.player.findMany({
    where: { currentClubId: { not: null } },
    select: {
      id: true,
      fullName: true,
      position: true,
      dateOfBirth: true,
      nationality: true,
      latestMarketValue: true,
      transfermarktId: true,
      status: true,
      currentClub: { select: { name: true } },
    },
  });

  console.log(`\nTotal Active Players Assigned to Clubs: ${allAuditedPlayers.length}`);

  let missingDob = 0;
  let missingNationality = 0;
  let missingPos = 0;
  let missingMarketValue = 0;
  let missingTmId = 0;
  let nonFirstTeamStatus = 0;

  for (const p of allAuditedPlayers) {
    if (!p.dateOfBirth) missingDob++;
    if (!p.nationality || p.nationality.length === 0) missingNationality++;
    if (!p.position || p.position === "Unknown") missingPos++;
    if (!p.latestMarketValue) missingMarketValue++;
    if (!p.transfermarktId) missingTmId++;
    if (p.status !== "first_team") nonFirstTeamStatus++;
  }

  console.log(`- Missing Date of Birth: ${missingDob}`);
  console.log(`- Missing Nationality: ${missingNationality}`);
  console.log(`- Missing Position: ${missingPos}`);
  console.log(`- Missing Market Value: ${missingMarketValue}`);
  console.log(`- Missing Transfermarkt ID: ${missingTmId}`);
  console.log(`- Non 'first_team' Status: ${nonFirstTeamStatus}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
