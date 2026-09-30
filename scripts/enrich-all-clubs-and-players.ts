import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parseTmSquadDetailed, TmPlayerDetails } from "./parse-tm-squad-detailed";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) throw new Error("No DIRECT_URL or DATABASE_URL");
const pool = new Pool({
  connectionString: directUrl.replace(/[?&]sslmode=[^&]*/, ""),
  ssl: { rejectUnauthorized: false },
  max: 10,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSquad(url: string): Promise<TmPlayerDetails[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();
  return parseTmSquadDetailed(html);
}

async function main() {
  console.log("==========================================================================================");
  console.log("=== ENRICHING & AUDITING ALL 114 CLUBS & PLAYERS DATA FOR OFFICIAL ACCURACY (2026/27) ===");
  console.log("==========================================================================================");

  // 1. Ensure Arsenal and Chelsea are in tm_epl_all_squads_detailed_2026.json
  const eplFile = "scripts/tm_epl_all_squads_detailed_2026.json";
  const eplSquads = JSON.parse(fs.readFileSync(eplFile, "utf-8"));
  if (!eplSquads["11"] || eplSquads["11"].length === 0) {
    console.log("Fetching detailed squad for Arsenal (TM 11)...");
    eplSquads["11"] = await fetchSquad("https://www.transfermarkt.com/fc-arsenal/startseite/verein/11/saison_id/2026");
  }
  if (!eplSquads["631"] || eplSquads["631"].length === 0) {
    console.log("Fetching detailed squad for Chelsea (TM 631)...");
    eplSquads["631"] = await fetchSquad("https://www.transfermarkt.com/fc-chelsea/startseite/verein/631/saison_id/2026");
  }
  fs.writeFileSync(
    eplFile,
    JSON.stringify(eplSquads, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2),
    "utf-8"
  );

  // 2. Load all 6 detailed squad datasets
  const leagueConfigs = [
    { name: "Premier League", file: "scripts/tm_epl_all_squads_detailed_2026.json", mappedFile: "scripts/mapped_epl_clubs.json" },
    { name: "LaLiga", file: "scripts/tm_laliga_all_squads_detailed_2026.json" },
    { name: "Serie A", file: "scripts/tm_seriea_all_squads_detailed_2026.json" },
    { name: "Ligue 1", file: "scripts/tm_ligue1_all_squads_detailed_2026.json" },
    { name: "Bundesliga", file: "scripts/tm_bundesliga_all_squads_detailed_2026.json" },
    { name: "Liga Portugal", file: "scripts/tm_portugal_all_squads_detailed_2026.json" },
  ];

  let totalClubsUpdated = 0;
  let totalPlayersEnriched = 0;
  let totalFmReplaced = 0;

  for (const cfg of leagueConfigs) {
    console.log(`\n------------------------------------------------------------------`);
    console.log(`🏆 Processing League: ${cfg.name}`);
    const squads = JSON.parse(fs.readFileSync(cfg.file, "utf-8"));

    let clubsList: { tmId: string; name: string; dbId?: string }[] = [];
    if (cfg.mappedFile && fs.existsSync(cfg.mappedFile)) {
      const mapped = JSON.parse(fs.readFileSync(cfg.mappedFile, "utf-8"));
      clubsList = mapped.map((m: any) => ({ tmId: m.tmId, name: m.dbName, dbId: m.dbId }));
    } else {
      const dbClubs = await prisma.club.findMany({
        where: { transfermarktId: { in: Object.keys(squads) } },
      });
      clubsList = dbClubs.map((c) => ({ tmId: c.transfermarktId!, name: c.name, dbId: c.id }));
    }

    for (let cIdx = 0; cIdx < clubsList.length; cIdx++) {
      const c = clubsList[cIdx];
      const tmSquad: TmPlayerDetails[] = squads[c.tmId] || [];
      if (!tmSquad || tmSquad.length === 0) continue;

      const dbPlayers = await prisma.player.findMany({
        where: { currentClubId: c.dbId },
      });

      // Enrich players
      for (const tmP of tmSquad) {
        let dbP = dbPlayers.find((p) => p.transfermarktId === tmP.tmId);
        if (!dbP) {
          const normTm = normalizeName(tmP.name);
          dbP = dbPlayers.find((p) => normalizeName(p.fullName) === normTm);
        }
        if (!dbP) {
          const normTm = normalizeName(tmP.name);
          dbP = dbPlayers.find(
            (p) =>
              normalizeName(p.fullName).includes(normTm) ||
              normTm.includes(normalizeName(p.fullName))
          );
        }

        if (dbP) {
          // If player has FM_ ID, delete and re-create with clean cuid
          if (dbP.id.startsWith("FM_")) {
            await prisma.player.delete({ where: { id: dbP.id } });
            await prisma.player.create({
              data: {
                fullName: tmP.name,
                position: tmP.pos || "Unknown",
                subPosition: tmP.pos || null,
                dateOfBirth: tmP.dob ? new Date(tmP.dob) : null,
                nationality: tmP.nationality || [],
                transfermarktId: tmP.tmId,
                latestMarketValue: tmP.marketValueBigInt ? BigInt(tmP.marketValueBigInt) : null,
                photoUrl: tmP.photoUrl || null,
                currentClubId: c.dbId,
                status: "first_team",
                lastSeason: 2026,
              },
            });
            totalFmReplaced++;
            totalPlayersEnriched++;
          } else {
            // Update metadata with official Transfermarkt values
            const updateData: any = {};
            if (tmP.dob && !dbP.dateOfBirth) updateData.dateOfBirth = new Date(tmP.dob);
            if (tmP.nationality && tmP.nationality.length > 0 && (!dbP.nationality || dbP.nationality.length === 0)) {
              updateData.nationality = tmP.nationality;
            }
            if (tmP.pos && (!dbP.position || dbP.position === "Unknown")) {
              updateData.position = tmP.pos;
            }
            if (tmP.pos && !dbP.subPosition) {
              updateData.subPosition = tmP.pos;
            }
            if (tmP.marketValueBigInt && (!dbP.latestMarketValue || dbP.latestMarketValue === 0n)) {
              updateData.latestMarketValue = BigInt(tmP.marketValueBigInt);
            }
            if (tmP.photoUrl && !dbP.photoUrl) {
              updateData.photoUrl = tmP.photoUrl;
            }
            if (tmP.tmId && !dbP.transfermarktId) {
              updateData.transfermarktId = tmP.tmId;
            }
            if (dbP.status !== "first_team") {
              updateData.status = "first_team";
            }
            updateData.lastSeason = 2026;

            if (Object.keys(updateData).length > 0) {
              await prisma.player.update({
                where: { id: dbP.id },
                data: updateData,
              });
              totalPlayersEnriched++;
            }
          }
        }
      }

      // Re-query current players after player updates
      const updatedPlayers = await prisma.player.findMany({
        where: { currentClubId: c.dbId },
        select: { latestMarketValue: true },
      });

      const totalVal = updatedPlayers.reduce(
        (sum, p) => sum + (p.latestMarketValue ? BigInt(p.latestMarketValue) : 0n),
        0n
      );

      // Update club statistics
      await prisma.club.update({
        where: { id: c.dbId },
        data: {
          squadSize: updatedPlayers.length,
          totalMarketValue: totalVal,
          lastSeason: 2026,
          lastSyncedAt: new Date(),
          squadSource: "Official Transfermarkt (2026/27 Season)",
        },
      });

      totalClubsUpdated++;
      console.log(
        ` [${cIdx + 1}/${clubsList.length}] ${c.name} -> Squad: ${updatedPlayers.length}, Total MV: €${(Number(totalVal) / 1e6).toFixed(1)}M`
      );
    }
  }

  console.log("\n==========================================================================================");
  console.log(`=== ENRICHMENT COMPLETE ===`);
  console.log(`Total Clubs Updated: ${totalClubsUpdated}`);
  console.log(`Total Players Enriched with TM Official Metadata: ${totalPlayersEnriched}`);
  console.log(`Total FM_ Player IDs Replaced with Clean Primary Keys: ${totalFmReplaced}`);
  console.log("==========================================================================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
