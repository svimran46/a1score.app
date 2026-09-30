import fs from "fs";
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
  const tmClubs: Array<{ tmId: string; name: string; squadUrl: string }> = JSON.parse(
    fs.readFileSync("scripts/tm_epl_clubs_2026.json", "utf-8")
  );

  const allDbClubs = await prisma.club.findMany({
    include: { league: true },
  });

  const matched = tmClubs.map((tm) => {
    // find in DB by transfermarktId or name
    let dbClub = allDbClubs.find((c) => c.transfermarktId === tm.tmId);
    if (!dbClub) {
      dbClub = allDbClubs.find((c) => c.name.toLowerCase() === tm.name.toLowerCase());
    }
    if (!dbClub) {
      // fuzzy search
      dbClub = allDbClubs.find(
        (c) =>
          c.name.toLowerCase().includes(tm.name.toLowerCase()) ||
          tm.name.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    return {
      tmId: tm.tmId,
      tmName: tm.name,
      squadUrl: tm.squadUrl,
      dbId: dbClub?.id || null,
      dbName: dbClub?.name || null,
      dbTmId: dbClub?.transfermarktId || null,
      dbLeague: dbClub?.league?.name || null,
    };
  });

  console.table(matched);

  fs.writeFileSync("scripts/mapped_epl_clubs.json", JSON.stringify(matched, null, 2), "utf-8");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
