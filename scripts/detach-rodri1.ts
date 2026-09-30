import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) {
  throw new Error("No database URL found");
}

const cleanUrl = directUrl.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const RODRI_1_ID = "cmuihs1h00179h29eublo2l4q";
const BARCA_ID = "cmuihoy3o002vb23f8egwo6vd";

const TOP_6_CLUBS: Record<string, string> = {
  "cmuihq3vs0069h29ebm5xqhye": "Manchester City",
  "cmuiho5do001hb23froc57owj": "Arsenal FC",
  "cmuihpzls003ph29em78a0y7v": "Arsenal FC",
  "cmuihq9wg009hh29ermlar2c7": "Real Madrid",
  "cmuihoy3o002vb23f8egwo6vd": "FC Barcelona",
  "cmuihq3qa0061h29eyxx4xw43": "Bayern Munich",
  "cmuihqbws00ajh29e1ujz5fht": "Paris Saint-Germain",
};

const top6DbIds = [
  "cmuihq3vs0069h29ebm5xqhye", // Man City
  "cmuiho5do001hb23froc57owj", // Arsenal
  "cmuihq9wg009hh29ermlar2c7", // Real Madrid
  "cmuihoy3o002vb23f8egwo6vd", // Barcelona
  "cmuihq3qa0061h29eyxx4xw43", // Bayern Munich
  "cmuihqbws00ajh29e1ujz5fht", // PSG
];

function normalizeName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(content: string): any[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') inQuote = !inQuote;
      else if (ch === "," && !inQuote) {
        cols.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim().replace(/^"|"$/g, ""));
    const obj: any = {};
    for (let h = 0; h < header.length; h++) obj[header[h]] = cols[h] || "";
    rows.push(obj);
  }
  return rows;
}

async function main() {
  console.log("==================================================================");
  console.log("=== DETACH RODRI #1 (cmuihs1h00179h29eublo2l4q) FROM FC BARCELONA ===");
  console.log("==================================================================");

  // Step 1: Export current Player row to backup_rodri1_before.json
  const playerBefore = await prisma.player.findUnique({
    where: { id: RODRI_1_ID },
  });

  if (!playerBefore) {
    throw new Error(`Player ${RODRI_1_ID} not found in database!`);
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "backup_rodri1_before.json"),
    JSON.stringify(playerBefore, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2),
    "utf-8"
  );
  console.log(`[Step 1] ✅ Exported backup_rodri1_before.json for ${playerBefore.fullName} (${RODRI_1_ID}).`);

  const previousClubId = playerBefore.currentClubId;
  const previousStatus = playerBefore.status;

  // Step 2 & 3: In one prisma.$transaction, set currentClubId to null and status to "departed"
  console.log("\n[Step 2 & 3] Executing single prisma.$transaction...");
  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id: RODRI_1_ID },
      data: {
        currentClubId: null,
        status: "departed",
      },
    });
    // Change nothing else! Do NOT touch Rodri #2, Club rows, or trans-rodri-1790753937374.
  }, { timeout: 30000 });
  console.log("✅ Transaction committed: Rodri #1 currentClubId set to null, status set to 'departed'.");

  // Step 4: Log the change to applied_changes.csv with previous club and status
  const appliedPath = path.resolve(process.cwd(), "applied_changes.csv");
  const timestamp = new Date().toISOString();
  // Columns: playerId,fullName,action,fromClubId,fromClubName,toClubId,toClubName,shirtNumber,position,status,timestamp
  const logLine = `"${RODRI_1_ID}","${playerBefore.fullName}","detach","${previousClubId || ""}","FC Barcelona","","Unassigned (previous status: ${previousStatus})","","${playerBefore.position}","departed","${timestamp}"\n`;

  fs.appendFileSync(appliedPath, logLine, "utf-8");
  console.log(`\n[Step 4] ✅ Appended change to applied_changes.csv with previous club (${previousClubId}) and status (${previousStatus}).`);

  // Step 5: Re-query FC Barcelona and confirm 32 players
  console.log("\n[Step 5] Re-querying FC Barcelona and all six clubs...");
  const barcaPlayers = await prisma.player.findMany({
    where: { currentClubId: BARCA_ID },
    orderBy: { fullName: "asc" },
  });

  console.log(`Live Barcelona player count: ${barcaPlayers.length} (Expected: 32)`);

  const targetFile = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");
  const targetRows = parseCsv(fs.readFileSync(targetFile, "utf-8")).filter(
    (t) => t.clubId === BARCA_ID
  );
  const targetIds = new Set(targetRows.map((t) => t.playerId));

  const fourPreExistingIds = new Set([
    "cmuihvvss02q7sexpqzpx8ho5", // Marc-André ter Stegen
    "cmuihvyqs062usexp2dgrq0ia", // Iñaki Peña
    "cmuihw3fb0buzsexp1fp9wgz6", // Diego Kochen
    "cmuihw43y0cecsexpynmi2300", // Guille Fernández
  ]);

  let missingTarget = 0;
  for (const t of targetRows) {
    const found = barcaPlayers.find(
      (p) => p.id === t.playerId || normalizeName(p.fullName) === normalizeName(t.fullName)
    );
    if (!found) {
      console.log(`❌ Missing target player: ${t.fullName}`);
      missingTarget++;
    }
  }

  let extraBarca = 0;
  for (const p of barcaPlayers) {
    const inTarget = targetIds.has(p.id) || targetRows.some((t) => normalizeName(t.fullName) === normalizeName(p.fullName));
    const inPre = fourPreExistingIds.has(p.id);
    if (!inTarget && !inPre) {
      console.log(`❌ Unexplained extra player in Barcelona: ${p.fullName} (${p.id})`);
      extraBarca++;
    }
  }

  console.log(`Target Roster Players present: ${targetRows.length - missingTarget}/${targetRows.length}`);
  console.log(`Pre-existing 4 present: ${fourPreExistingIds.size}/4`);
  console.log(`Unexplained extra players: ${extraBarca}`);

  // Total across all 6 clubs
  const allTop6Players = await prisma.player.findMany({
    where: { currentClubId: { in: top6DbIds } },
  });
  console.log(`\nTotal players across all six clubs: ${allTop6Players.length} (Expected: 175)`);
  for (const cId of top6DbIds) {
    const count = allTop6Players.filter((p) => p.currentClubId === cId).length;
    console.log(`- ${TOP_6_CLUBS[cId]}: ${count}`);
  }

  // Step 6: Show transfer trans-rodri-1790753937374 in full
  console.log("\n[Step 6] Transfer record trans-rodri-1790753937374 in full:");
  const transfer = await prisma.transfer.findUnique({
    where: { id: "trans-rodri-1790753937374" },
    include: { player: true },
  });
  console.log(JSON.stringify(transfer, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
