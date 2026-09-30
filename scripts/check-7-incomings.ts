import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function check() {
  const ids = [
    "cmuihw3ew0bk2sexpckwsp9gl", // Marco Palestra
    "cmuihw3el0bc7sexpi4ywz0bu", // Valentín Barco
    "cmuihvvye03cysexp6i5qq99j", // Emiliano Martínez
    "cmuihw0iu0868sexppt652rcy", // Maxence Lacroix
    "cmuihw23v09nesexpfic32t6u", // Pep Chavarría
    "cmuihvuy302f3sexp4l8z602u", // Jordan Henderson
    "cmuihvuyj02jmsexplg90ysf1", // Danny Welbeck
  ];

  const players = await prisma.player.findMany({
    where: { id: { in: ids } },
    include: { currentClub: true },
  });

  for (const p of players) {
    console.log(`- ${p.fullName} | ID: ${p.id} | Club: ${p.currentClub?.name || "null"} | ClubId: ${p.currentClubId}`);
  }

  await prisma.$disconnect();
  await pool.end();
}
check().catch(console.error);
