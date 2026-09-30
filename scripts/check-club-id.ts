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
  const club = await prisma.club.findUnique({ where: { id: "cmuihq7gc0083h29exnlti38f" } });
  console.log("Club for cmuihq7gc0083h29exnlti38f:", club?.name, club?.id);
  await prisma.$disconnect();
  await pool.end();
}
check().catch(console.error);
