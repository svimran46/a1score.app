import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
  const targetFile = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");
  const targetRows = parseCsv(fs.readFileSync(targetFile, "utf-8"));

  const targetByClub = new Map<string, any[]>();
  for (const t of targetRows) {
    let cId = t.clubId;
    if (cId === "cmuihpzls003ph29em78a0y7v") cId = "cmuiho5do001hb23froc57owj";
    if (!targetByClub.has(cId)) targetByClub.set(cId, []);
    targetByClub.get(cId)!.push(t);
  }

  const allDbPlayers = await prisma.player.findMany({
    where: { currentClubId: { in: top6DbIds } },
  });

  const dbByClub = new Map<string, any[]>();
  for (const p of allDbPlayers) {
    if (!p.currentClubId) continue;
    if (!dbByClub.has(p.currentClubId)) dbByClub.set(p.currentClubId, []);
    dbByClub.get(p.currentClubId)!.push(p);
  }

  console.log("==================================================================");
  console.log("=== COMPREHENSIVE POST-APPLY ROSTER AUDIT REPORT ===");
  console.log("==================================================================");

  let grandTotalDb = 0;
  let grandTotalTarget = 0;

  for (const cId of top6DbIds) {
    const clubName = TOP_6_CLUBS[cId];
    const targetSquad = targetByClub.get(cId) || [];
    const dbSquad = dbByClub.get(cId) || [];

    grandTotalDb += dbSquad.length;
    grandTotalTarget += targetSquad.length;

    console.log(`\n------------------------------------------------------------`);
    console.log(`Club: ${clubName}`);
    console.log(`  Target Roster Count: ${targetSquad.length}`);
    console.log(`  Live DB Player Count: ${dbSquad.length} (${dbSquad.filter(p => p.status === 'first_team').length} first_team, ${dbSquad.filter(p => p.status === 'academy').length} academy)`);

    // Match target players in DB
    const missingTargetPlayers: any[] = [];
    for (const t of targetSquad) {
      const found = dbSquad.find(p => {
        if (p.id === t.playerId) return true;
        if (normalizeName(p.fullName) === normalizeName(t.fullName)) return true;
        // Bara Ndiaye mapping
        if (normalizeName(t.fullName) === "bara ndiaye" && normalizeName(p.fullName) === "bara sapoko ndiaye") return true;
        return false;
      });
      if (!found) {
        missingTargetPlayers.push(t);
      }
    }

    // Players in DB not in target
    const extraInDb: any[] = [];
    for (const p of dbSquad) {
      const found = targetSquad.find(t => {
        if (t.playerId === p.id) return true;
        if (normalizeName(t.fullName) === normalizeName(p.fullName)) return true;
        if (normalizeName(t.fullName) === "bara ndiaye" && normalizeName(p.fullName) === "bara sapoko ndiaye") return true;
        return false;
      });
      if (!found) {
        extraInDb.push(p);
      }
    }

    console.log(`  Missing Target Players: ${missingTargetPlayers.length === 0 ? "✅ None (All target players present in DB!)" : missingTargetPlayers.map(m => m.fullName).join(", ")}`);
    if (extraInDb.length > 0) {
      console.log(`  Pre-existing DB Players Untouched (not in audit CSV per Condition 6):`);
      for (const e of extraInDb) {
        const isRodri = e.id === "cmuihvzbj0784sexpy0rbk4pc";
        console.log(`    - ${e.fullName} (${e.id}) [status: ${e.status}] ${isRodri ? "<- Confirmed: Rodri held for review at FC Barcelona" : ""}`);
      }
    } else {
      console.log(`  Extra Players in DB: None (Matches target exactly!)`);
    }
  }

  console.log(`\n==================================================================`);
  console.log(`Grand Totals across 6 clubs: Target=${grandTotalTarget}, Live DB=${grandTotalDb}`);
  console.log(`==================================================================`);
}

main().finally(() => prisma.$disconnect());
