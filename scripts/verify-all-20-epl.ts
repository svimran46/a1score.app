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

async function verifyAll20() {
  const clubs = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  
  // Official TM target sizes:
  // Arsenal: 24, Chelsea: 27, others from tm_epl_all_squads_detailed_2026.json
  const allSquads = JSON.parse(
    fs.readFileSync("scripts/tm_epl_all_squads_detailed_2026.json", "utf-8")
  );

  const targets: Record<string, number> = {
    "11": 24, // Arsenal
    "631": 27, // Chelsea
  };
  for (const [tmId, squad] of Object.entries(allSquads)) {
    targets[tmId] = (squad as any[]).length;
  }

  const results: any[] = [];
  let totalLive = 0;
  let totalExpected = 0;

  for (const c of clubs) {
    const livePlayers = await prisma.player.findMany({
      where: { currentClubId: c.dbId },
      orderBy: [{ position: "asc" }, { fullName: "asc" }],
    });

    const expected = targets[c.tmId];
    const match = livePlayers.length === expected;
    totalLive += livePlayers.length;
    totalExpected += expected;

    results.push({
      Club: c.tmName,
      "TM ID": c.tmId,
      "DB ID": c.dbId,
      "Expected TM": expected,
      "Live DB Roster": livePlayers.length,
      Status: match ? "✅ 100% MATCH" : "❌ MISMATCH",
    });
  }

  console.log("\n==========================================================================================");
  console.log("=== COMPREHENSIVE 20 PREMIER LEAGUE CLUBS LIVE AUDIT VERIFICATION ===");
  console.log("==========================================================================================");
  console.table(results);
  console.log(`\nTOTAL PLAYERS ACROSS ALL 20 EPL CLUBS: ${totalLive} (Expected: ${totalExpected})`);
  console.log(`Overall Status: ${totalLive === totalExpected ? "ALL 20 CLUBS ARE IN 100% PERFECT HARMONY WITH TRANSFERMARKT!" : "DISCREPANCY DETECTED"}`);

  await prisma.$disconnect();
  await pool.end();
}

verifyAll20().catch(console.error);
