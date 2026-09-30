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
  const p = await prisma.player.findUnique({ where: { id: "FM_1187225" } });
  if (p) {
    await prisma.player.delete({ where: { id: "FM_1187225" } });
    await prisma.player.create({
      data: {
        fullName: p.fullName,
        position: p.position || "Defender",
        transfermarktId: "585971",
        status: "departed",
        currentClubId: null,
      },
    });
    console.log("Replaced FM_1187225 with clean cuid.");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
