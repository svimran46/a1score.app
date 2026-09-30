import fs from "fs";
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
  const laliga = JSON.parse(fs.readFileSync("scripts/tm_laliga_all_squads_detailed_2026.json", "utf-8"));
  const barcaTm = laliga["131"];
  console.log("TM Barcelona Squad (2026/27):", barcaTm.length);
  console.log(barcaTm.map((p: any) => `${p.name} (TM ${p.tmId}, ${p.pos})`).join("\n"));

  const barcaDb = await prisma.player.findMany({
    where: { currentClub: { name: "FC Barcelona" } },
    select: { id: true, fullName: true, transfermarktId: true, position: true },
  });
  console.log(`\nDB Barcelona Squad (${barcaDb.length}):`);
  console.log(barcaDb.map((p) => `${p.fullName} (ID ${p.id}, TM ${p.transfermarktId}, ${p.position})`).join("\n"));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
