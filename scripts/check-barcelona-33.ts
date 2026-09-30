import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
  const barcaId = "cmuihoy3o002vb23f8egwo6vd";

  // 1. Query all players currently at Barcelona in the database
  const dbPlayers = await prisma.player.findMany({
    where: { currentClubId: barcaId },
    orderBy: { fullName: "asc" },
  });

  console.log(`=== LIVE BARCELONA PLAYERS IN DB (${dbPlayers.length}) ===`);

  // 2. Read TOP_6_CLUBS_ROSTER.csv for Barcelona
  const targetFile = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");
  const targetRows = parseCsv(fs.readFileSync(targetFile, "utf-8")).filter(
    (t) => t.clubId === barcaId
  );
  console.log(`=== BARCELONA TARGET ROSTER ROWS (${targetRows.length}) ===`);

  // 3. The 4 pre-existing players
  const fourPreExistingIds = new Set([
    "cmuihvvss02q7sexpqzpx8ho5", // Marc-André ter Stegen
    "cmuihvyqs062usexp2dgrq0ia", // Iñaki Peña
    "cmuihw3fb0buzsexp1fp9wgz6", // Diego Kochen
    "cmuihw43y0cecsexpynmi2300", // Guille Fernández
  ]);

  // Combine target rows + 4 pre-existing
  const targetIds = new Set(targetRows.map((t) => t.playerId));

  console.log("\n--- COMPARING ALL 33 DB PLAYERS ---");
  const leftover: any[] = [];
  const matchedTarget: any[] = [];
  const matchedPreExisting: any[] = [];

  for (const p of dbPlayers) {
    const inTargetById = targetIds.has(p.id);
    const inTargetByName = targetRows.find(
      (t) => normalizeName(t.fullName) === normalizeName(p.fullName)
    );
    const inPreExisting = fourPreExistingIds.has(p.id);

    let category = "LEFTOVER / EXTRA";
    if (inTargetById || inTargetByName) {
      category = `Target Roster file (ID: ${inTargetByName?.playerId || p.id})`;
      matchedTarget.push(p);
    } else if (inPreExisting) {
      category = "Pre-existing 4";
      matchedPreExisting.push(p);
    } else {
      leftover.push(p);
    }

    console.log(
      `- ${p.fullName} | ID: ${p.id} | TM: ${p.transfermarktId || "none"} | Pos: ${p.position} | Status: ${p.status} => [${category}]`
    );
  }

  console.log("\n========================================================");
  console.log(`Matched Target Roster: ${matchedTarget.length}`);
  console.log(`Matched Pre-existing 4: ${matchedPreExisting.length}`);
  console.log(`Leftover / Extra: ${leftover.length}`);
  for (const l of leftover) {
    console.log(`EXTRA: ${l.fullName} (ID: ${l.id}, TM: ${l.transfermarktId})`);
  }
  console.log("========================================================");
}

main().finally(() => prisma.$disconnect());
