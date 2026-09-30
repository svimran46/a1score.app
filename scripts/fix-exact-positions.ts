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

const exactPositions: Record<string, { pos: string; subPos: string }> = {
  "944181": { pos: "Attacking Midfield", subPos: "Attacking Midfield" }, // Hugo Picard
  "469957": { pos: "Attacking Midfield", subPos: "Attacking Midfield" }, // Kastriot Imeri
  "516978": { pos: "Right-Back", subPos: "Right-Back" },                 // Laurin Curda
  "907085": { pos: "Centre-Forward", subPos: "Centre-Forward" },         // Ruben Müller
  "1148887": { pos: "Defensive Midfield", subPos: "Defensive Midfield" }, // Clemens Lippmann
  "949389": { pos: "Left Winger", subPos: "Left Winger" },               // Niklas Mohr
  "959680": { pos: "Right Winger", subPos: "Right Winger" },             // Kamika
  "510686": { pos: "Left-Back", subPos: "Left-Back" },                   // William Kokolo
  "1130743": { pos: "Central Midfield", subPos: "Central Midfield" },    // Lorenzo Berardi
  "1297635": { pos: "Central Midfield", subPos: "Central Midfield" },    // Nassim Laarej
};

async function main() {
  for (const [tmId, info] of Object.entries(exactPositions)) {
    const res = await prisma.player.updateMany({
      where: { transfermarktId: tmId },
      data: {
        position: info.pos,
        subPosition: info.subPos,
      },
    });
    console.log(`Updated TM ${tmId} -> ${info.pos} (${res.count} rows)`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
