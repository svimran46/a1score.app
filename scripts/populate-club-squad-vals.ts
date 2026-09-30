import { PrismaClient } from "@prisma/client";
import { tmGetClub } from "../src/lib/transfermarkt/client";

const prisma = new PrismaClient();

const CLUBS_TO_SYNC = [
  { name: "Coventry City", tmId: "990" },
  { name: "Deportivo de La Coruña", tmId: "897" },
  { name: "Racing Santander", tmId: "630" },
  { name: "Málaga CF", tmId: "1084" },
  { name: "SV 07 Elversberg", tmId: "64" },
  { name: "SC Paderborn 07", tmId: "127" },
  { name: "Le Mans FC", tmId: "1164" },
  { name: "Académico Viseu FC", tmId: "7788" },
  { name: "CS Marítimo", tmId: "1301" },
  { name: "SC Cambuur Leeuwarden", tmId: "133" },
  { name: "ADO Den Haag", tmId: "868" },
];

async function main() {
  for (const c of CLUBS_TO_SYNC) {
    console.log(`Syncing ${c.name} (${c.tmId})...`);
    let val = 25000000;
    let size = 25;
    try {
      const tm = await tmGetClub(c.tmId);
      if (tm && tm.totalSquadValue > 0) {
        val = tm.totalSquadValue;
        size = tm.players?.length || 25;
      }
    } catch (e) {
      console.warn("TM fetch error:", e);
    }

    const res = await prisma.club.updateMany({
      where: {
        OR: [
          { transfermarktId: c.tmId },
          { name: { contains: c.name, mode: "insensitive" } },
        ],
      },
      data: {
        totalMarketValue: BigInt(val),
        squadSize: size,
        transfermarktId: c.tmId,
        lastSeason: 2026,
      },
    });
    console.log(`Updated ${c.name} (${res.count} rows): €${(val / 1e6).toFixed(1)}M, size: ${size}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
