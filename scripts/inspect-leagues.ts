import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const leagues = await prisma.league.findMany({
    include: { _count: { select: { clubs: true } } },
    orderBy: { name: "asc" },
  });
  console.log(`Total leagues in DB: ${leagues.length}`);
  console.table(
    leagues.map((l) => ({
      id: l.id,
      name: l.name,
      country: l.country,
      clubsCount: l._count.clubs,
    }))
  );

  // Also check clubs without a league
  const unassignedClubs = await prisma.club.count({
    where: { leagueId: null },
  });
  console.log(`Clubs without a league: ${unassignedClubs}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
