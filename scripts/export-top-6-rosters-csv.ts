/**
 * scripts/export-top-6-rosters-csv.ts
 *
 * Exports the projected first-team rosters for the top 6 clubs to docs/TOP_6_CLUBS_ROSTER.csv:
 * - Manchester City
 * - Real Madrid
 * - FC Barcelona
 * - Arsenal FC
 * - Paris Saint-Germain
 * - Bayern Munich
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fotmobFetch } from "../src/lib/fotmob/client";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

const TOP_6 = [
  { name: "Manchester City", fotmobId: 8456, clubId: "cmuihq3vs0069h29ebm5xqhye" },
  { name: "Real Madrid", fotmobId: 8633, clubId: "cmuihq9wg009hh29ermlar2c7" },
  { name: "FC Barcelona", fotmobId: 8634, clubId: "cmuihoy3o002vb23f8egwo6vd" },
  { name: "Arsenal FC", fotmobId: 9825, clubId: "cmuihpzls003ph29em78a0y7v" },
  { name: "Paris Saint-Germain", fotmobId: 9847, clubId: "cmuihqbws00ajh29e1ujz5fht" },
  { name: "Bayern Munich", fotmobId: 9823, clubId: "cmuihq3qa0061h29eyxx4xw43" },
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

async function main() {
  console.log("=== Exporting Top 6 Rosters CSV ===");

  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const playersRes = await client.query(`
    SELECT
      p.id,
      p."fullName",
      p."transfermarktId",
      p."position",
      p."latestMarketValue",
      p."status",
      p."currentClubId"
    FROM "Player" p
  `);

  const playerByName = new Map<string, any>();
  const playerById = new Map<string, any>();
  for (const p of playersRes.rows) {
    playerById.set(p.id, p);
    playerByName.set(normalizeName(p.fullName), p);
  }

  const csvRows: string[] = [];
  const header = "clubName,clubId,shirtNumber,position,fullName,status,marketValueEur,playerId,transfermarktId";
  csvRows.push(header);

  for (const club of TOP_6) {
    console.log(`Fetching squad for ${club.name} (FotMob ID: ${club.fotmobId})...`);
    const data = await fotmobFetch<any>(`/api/data/teams?id=${club.fotmobId}`, 3600);
    const groups = (data?.squad?.squad || []).filter((g: any) => g.title !== "coach");

    let count = 0;
    for (const group of groups) {
      const posCategory = group.title; // keepers, defenders, midfielders, attackers
      for (const m of group.members || []) {
        const norm = normalizeName(m.name);
        const existingPlayer = playerByName.get(norm);

        const shirtNumber = m.shirtNumber != null ? m.shirtNumber : "N/A";
        const position = m.role?.key || posCategory || existingPlayer?.position || "Unknown";
        const status = (m.shirtNumber != null && ["keepers", "defenders", "midfielders", "attackers"].includes(posCategory))
          ? "first_team"
          : "academy";

        const mv = existingPlayer?.latestMarketValue ? Number(existingPlayer.latestMarketValue) : 0;
        const pId = existingPlayer ? existingPlayer.id : `FM_${m.id}`;
        const tmId = existingPlayer?.transfermarktId || "N/A";

        csvRows.push(
          `"${club.name}","${club.clubId}","${shirtNumber}","${position}","${m.name.replace(/"/g, '""')}","${status}",${mv},"${pId}","${tmId}"`
        );
        count++;
      }
    }
    console.log(`  -> ${count} members exported for ${club.name}`);
  }

  const docsDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const outPath = path.join(docsDir, "TOP_6_CLUBS_ROSTER.csv");
  fs.writeFileSync(outPath, csvRows.join("\n"), "utf-8");
  console.log(`Saved ${csvRows.length - 1} rows to ${outPath}`);

  await client.end();
}

main().catch(console.error);
