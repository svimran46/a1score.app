import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function search() {
  const terms = ["Abraham", "Aarons", "Lammens", "Jaouen", "Hackney", "Costinha", "Hadjam"];
  for (const t of terms) {
    const res = await prisma.player.findMany({
      where: { fullName: { contains: t, mode: "insensitive" } },
      include: { currentClub: true },
    });
    console.log(`\nResults for "${t}": ${res.length}`);
    for (const p of res) {
      console.log(`- ${p.fullName} (TM: ${p.transfermarktId}, Club: ${p.currentClub?.name || "Unassigned"}, ID: ${p.id})`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

search().catch(console.error);
