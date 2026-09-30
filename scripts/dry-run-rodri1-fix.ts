import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

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

  console.log("==================================================================");
  console.log("=== DRY RUN: PROPOSED FIX FOR RODRI #1 (cmuihs1h00179h29eublo2l4q) ===");
  console.log("==================================================================");

  // 1. Current DB state
  const livePlayers = await prisma.player.findMany({
    where: { currentClubId: barcaId },
  });

  console.log(`Current Barcelona live squad count: ${livePlayers.length}`);

  // 2. Simulated squad if we detach Rodri #1 (cmuihs1h00179h29eublo2l4q)
  const simulatedSquad = livePlayers.filter(
    (p) => p.id !== "cmuihs1h00179h29eublo2l4q"
  );
  console.log(`Simulated Barcelona squad count after detaching Rodri #1: ${simulatedSquad.length}`);

  // 3. Compare with TOP_6_CLUBS_ROSTER.csv (28) + 4 pre-existing (4) = 32 expected
  const targetFile = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");
  const targetRows = parseCsv(fs.readFileSync(targetFile, "utf-8")).filter(
    (t) => t.clubId === barcaId
  );
  const fourPreExistingIds = new Set([
    "cmuihvvss02q7sexpqzpx8ho5", // Marc-André ter Stegen
    "cmuihvyqs062usexp2dgrq0ia", // Iñaki Peña
    "cmuihw3fb0buzsexp1fp9wgz6", // Diego Kochen
    "cmuihw43y0cecsexpynmi2300", // Guille Fernández
  ]);

  const targetIds = new Set(targetRows.map((t) => t.playerId));

  let missingCount = 0;
  for (const t of targetRows) {
    const found = simulatedSquad.find(
      (p) => p.id === t.playerId || normalizeName(p.fullName) === normalizeName(t.fullName)
    );
    if (!found) {
      console.log(`Missing from simulated squad: ${t.fullName}`);
      missingCount++;
    }
  }

  let extraCount = 0;
  for (const p of simulatedSquad) {
    const inTarget = targetIds.has(p.id) || targetRows.some((t) => normalizeName(t.fullName) === normalizeName(p.fullName));
    const inPreExisting = fourPreExistingIds.has(p.id);
    if (!inTarget && !inPreExisting) {
      console.log(`Extra in simulated squad: ${p.fullName} (${p.id})`);
      extraCount++;
    }
  }

  console.log("\n--- DRY RUN RESULTS ---");
  console.log(`Expected squad count: 32 (28 target + 4 pre-existing)`);
  console.log(`Simulated squad count: ${simulatedSquad.length}`);
  console.log(`Missing target players: ${missingCount}`);
  console.log(`Unexplained extra players: ${extraCount}`);
  if (simulatedSquad.length === 32 && missingCount === 0 && extraCount === 0) {
    console.log("✅ PERFECT MATCH: 32 players, 0 discrepancies!");
  }

  console.log("\n[DRY RUN ONLY] Zero database writes performed.");
}

main().finally(() => prisma.$disconnect());
