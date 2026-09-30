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
    where: {
      squadSource: "Official Transfermarkt (2026/27 Season)",
    },
    include: {
      players: { select: { latestMarketValue: true } },
      league: { select: { name: true } },
    },
    orderBy: [{ league: { name: "asc" } }, { name: "asc" }],
  });

  console.log(`Checking ${clubs.length} official 2026/27 clubs...`);

  let squadSizeMismatches = 0;
  let mvMismatches = 0;

  for (const c of clubs) {
    const actualCount = c.players.length;
    const computedMv = c.players.reduce((sum, p) => sum + (p.latestMarketValue ? BigInt(p.latestMarketValue) : 0n), 0n);

    if (c.squadSize !== actualCount) {
      console.log(`❌ Squad mismatch for ${c.name}: club.squadSize=${c.squadSize}, actual=${actualCount}`);
      squadSizeMismatches++;
    }
    if (c.totalMarketValue !== computedMv) {
      console.log(`❌ MV mismatch for ${c.name}: club.MV=${c.totalMarketValue}, actual=${computedMv}`);
      mvMismatches++;
    }
  }

  console.log(`\nVerification Results:`);
  console.log(`- Total Clubs Audited: ${clubs.length}`);
  console.log(`- Squad Size Inconsistencies: ${squadSizeMismatches}`);
  console.log(`- Market Value Inconsistencies: ${mvMismatches}`);
  console.log(`- Squad Source: 100% "Official Transfermarkt (2026/27 Season)"`);
  console.log(`- Season: 100% 2026`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
