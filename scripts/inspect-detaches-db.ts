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
  const content = fs.readFileSync("detaches_to_verify.csv", "utf-8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map((l) => {
    const cols = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.replace(/^"|"$/g, "").trim());
    return {
      clubId: cols[0],
      clubName: cols[1],
      playerId: cols[2],
      fullName: cols[3],
      marketValueEur: cols[4],
      dateOfBirth: cols[5],
      age: cols[6],
      verifyReason: cols[7],
    };
  });

  const playerIds = rows.map((r) => r.playerId);
  const dbPlayers = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: {
      transfers: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
  });

  const dbMap = new Map(dbPlayers.map((p) => [p.id, p]));

  const byClub: Record<string, any[]> = {};
  for (const r of rows) {
    if (!byClub[r.clubName]) byClub[r.clubName] = [];
    const p = dbMap.get(r.playerId);
    byClub[r.clubName].push({
      ...r,
      tmId: p?.transfermarktId,
      status: p?.status,
      transfers: p?.transfers,
    });
  }

  for (const [c, list] of Object.entries(byClub)) {
    console.log(`\n=== ${c} (${list.length} players) ===`);
    for (const item of list) {
      console.log(`- ${item.fullName} | DoB: ${item.dateOfBirth} | TM: ${item.tmId} | MV: ${item.marketValueEur}`);
      if (item.transfers?.length) {
        console.log(`    Recent transfers: ${item.transfers.map((t: any) => `${t.date.toISOString().split("T")[0]}: ${t.fromClubName} -> ${t.toClubName} (${t.transferType || "trans"})`).join(", ")}`);
      }
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
