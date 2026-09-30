/**
 * scripts/export-dataset.ts
 *
 * Exports audited database state to data/export/clubs.csv and data/export/players.csv.
 * Uses the canonical active-roster rule:
 * - status != 'departed' and currentClubId IS NOT NULL
 * - Loaned players count at their loan club (currentClubId) with parentClubId / parentClubName preserved.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) {
  console.error("Missing DIRECT_URL or DATABASE_URL environment variable.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: directUrl.replace(/[?&]sslmode=[^&]*/, ""),
  ssl: { rejectUnauthorized: false },
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function quoteCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

async function exportDataset() {
  console.log("=== a1score.app Audited Dataset Export ===");

  const exportDir = path.join(process.cwd(), "data", "export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 1. Export Clubs
  console.log("\n1. Fetching clubs and active squad aggregates...");
  const clubs = await prisma.club.findMany({
    include: {
      league: {
        select: {
          transfermarktId: true,
          name: true,
        },
      },
      players: {
        where: {
          OR: [
            { status: null },
            { status: { not: "departed" } },
          ],
        },
        select: {
          id: true,
          latestMarketValue: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const clubRows: string[] = [];
  clubRows.push("id,name,leagueCode,squadSize,totalMarketValue,lastSyncedAt");

  for (const c of clubs) {
    const leagueCode = c.league?.transfermarktId || "";
    const activeSquadCount = c.players.length;
    const squadSize = activeSquadCount > 0 ? activeSquadCount : (c.squadSize ?? 0);

    const activeSquadValue = c.players.reduce(
      (sum, p) => sum + (p.latestMarketValue ? BigInt(p.latestMarketValue) : BigInt(0)),
      BigInt(0)
    );
    const totalMarketValue = (activeSquadValue > BigInt(0)
      ? activeSquadValue
      : (c.totalMarketValue ? BigInt(c.totalMarketValue) : BigInt(0))
    ).toString();

    const lastSyncedAt = c.lastSyncedAt ? c.lastSyncedAt.toISOString() : "";

    clubRows.push(
      `${quoteCsv(c.id)},${quoteCsv(c.name)},${quoteCsv(leagueCode)},${squadSize},${totalMarketValue},${quoteCsv(lastSyncedAt)}`
    );
  }

  const clubsCsvPath = path.join(exportDir, "clubs.csv");
  fs.writeFileSync(clubsCsvPath, clubRows.join("\n") + "\n", "utf-8");
  console.log(`Saved ${clubs.length} clubs to ${clubsCsvPath}`);

  // 2. Export Players (active roster: status != 'departed', loans count at loan club)
  console.log("\n2. Fetching active roster players...");
  const players = await prisma.player.findMany({
    where: {
      AND: [
        {
          OR: [
            { status: null },
            { status: { not: "departed" } },
          ],
        },
        { currentClubId: { not: null } },
      ],
    },
    include: {
      currentClub: {
        select: { id: true, name: true },
      },
      parentClub: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { currentClub: { name: "asc" } },
      { fullName: "asc" },
    ],
  });

  const playerRows: string[] = [];
  playerRows.push(
    "id,fullName,commonName,transfermarktId,dateOfBirth,nationality,position,subPosition,heightCm,latestMarketValue,status,currentClubId,currentClubName,parentClubId,parentClubName,loanUntil"
  );

  for (const p of players) {
    const dob = p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "";
    const nat = Array.isArray(p.nationality) ? p.nationality.join("; ") : (p.nationality || "");
    const mv = p.latestMarketValue ? p.latestMarketValue.toString() : "0";
    const loanUntil = p.loanUntil ? p.loanUntil.toISOString().slice(0, 10) : "";
    const currentClubName = p.currentClub?.name || "";
    const parentClubName = p.parentClub?.name || "";

    playerRows.push(
      `${quoteCsv(p.id)},${quoteCsv(p.fullName)},${quoteCsv(p.commonName || "")},${quoteCsv(p.transfermarktId || "")},${quoteCsv(dob)},${quoteCsv(nat)},${quoteCsv(p.position)},${quoteCsv(p.subPosition || "")},${p.heightCm ?? ""},${mv},${quoteCsv(p.status || "first_team")},${quoteCsv(p.currentClubId)},${quoteCsv(currentClubName)},${quoteCsv(p.parentClubId || "")},${quoteCsv(parentClubName)},${quoteCsv(loanUntil)}`
    );
  }

  const playersCsvPath = path.join(exportDir, "players.csv");
  fs.writeFileSync(playersCsvPath, playerRows.join("\n") + "\n", "utf-8");
  console.log(`Saved ${players.length} active players to ${playersCsvPath}`);

  console.log("\n✅ [Export Complete] Audited dataset exported successfully.");
}

exportDataset()
  .catch((err) => {
    console.error("Fatal error during dataset export:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
