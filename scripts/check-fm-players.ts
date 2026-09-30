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
  const fmPlayers = await prisma.player.findMany({
    where: { id: { startsWith: "FM_" } },
    include: {
      marketValues: true,
      transfers: true,
      seasonStats: true,
      injuries: true,
      currentClub: { select: { name: true } },
    },
  });

  console.log(`Found ${fmPlayers.length} FM_ players in DB:`);
  for (const p of fmPlayers) {
    console.log(
      `${p.id}: ${p.fullName} (Club: ${p.currentClub?.name}) | MV count: ${p.marketValues.length}, Transfers: ${p.transfers.length}, Stats: ${p.seasonStats.length}`
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
