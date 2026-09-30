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
  const missingDataPlayers = await prisma.player.findMany({
    where: {
      currentClubId: { not: null },
      OR: [
        { dateOfBirth: null },
        { nationality: { isEmpty: true } },
        { position: "Unknown" },
        { position: "" },
        { transfermarktId: null },
      ],
    },
    include: {
      currentClub: { select: { name: true, league: { select: { name: true } } } },
    },
  });

  console.log(`Found ${missingDataPlayers.length} players with missing basic metadata:`);
  console.table(
    missingDataPlayers.map((p) => ({
      id: p.id,
      name: p.fullName,
      club: p.currentClub?.name,
      league: p.currentClub?.league?.name,
      dob: p.dateOfBirth?.toISOString()?.slice(0, 10) || "NULL",
      pos: p.position || "NULL",
      nat: p.nationality?.join(", ") || "EMPTY",
      tmId: p.transfermarktId || "NULL",
    }))
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
