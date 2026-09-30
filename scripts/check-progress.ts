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
  const updatedClubs = await prisma.club.findMany({
    where: { squadSource: { contains: "Official Transfermarkt" } },
    select: { name: true, squadSize: true, totalMarketValue: true },
  });
  console.log(`Clubs with 'Official Transfermarkt': ${updatedClubs.length}`);
  for (const c of updatedClubs) {
    console.log(` - ${c.name}: squadSize=${c.squadSize}, MV=€${(Number(c.totalMarketValue) / 1e6).toFixed(1)}M`);
  }

  // Check Allan
  const allan = await prisma.player.findMany({
    where: { fullName: { contains: "Allan" } },
    select: { id: true, fullName: true, currentClub: { select: { name: true } }, transfermarktId: true },
  });
  console.log("Allan in DB:", allan);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
