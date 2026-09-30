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
    "cmuihvwru03vysexpyx8qaql4", // Trossard
    "cmuihw24k0a6qsexp2t10fjmh", // Martinelli
    "cmuihw3fc0bvvsexpksu1ma1l", // Rojas
    "cmuihw3el0bc2sexp7tgcux59", // Setford
  ];
  const players = await prisma.player.findMany({ where: { id: { in: ids } } });
  console.log(
    JSON.stringify(
      players,
      (k, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    )
  );
  await prisma.$disconnect();
  await pool.end();
}

check().catch(console.error);
