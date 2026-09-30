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

async function mapLaLiga() {
  const url = "https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1/saison_id/2026";
  console.log(`Fetching LaLiga overview from ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const tableMatch = html.match(/<table class="items">([\s\S]*?)<\/table>/);
  if (!tableMatch) throw new Error("Could not find table.items");

  const rows = tableMatch[1].split(/<tr class="(?:odd|even)">/);
  const tmClubs: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i].split("</tr>")[0];
    const m = r.match(/<td class="hauptlink no-border-links">\s*<a[^>]*href="([^"]*\/verein\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i);
    if (m) {
      tmClubs.push({
        tmId: m[2],
        tmName: m[3].trim(),
        squadUrl: `https://www.transfermarkt.com${m[1]}`,
      });
    }
  }

  console.log(`Parsed ${tmClubs.length} LaLiga clubs from TM.`);

  const allDbClubs = await prisma.club.findMany({
    include: { league: true },
  });

  const matched = tmClubs.map((tm) => {
    let dbClub = allDbClubs.find((c) => c.transfermarktId === tm.tmId);
    if (!dbClub) {
      dbClub = allDbClubs.find((c) => c.name.toLowerCase() === tm.tmName.toLowerCase());
    }
    if (!dbClub) {
      dbClub = allDbClubs.find(
        (c) =>
          c.name.toLowerCase().includes(tm.tmName.toLowerCase()) ||
          tm.tmName.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    return {
      tmId: tm.tmId,
      tmName: tm.tmName,
      squadUrl: tm.squadUrl,
      dbId: dbClub?.id || null,
      dbName: dbClub?.name || null,
      dbTmId: dbClub?.transfermarktId || null,
      dbLeague: dbClub?.league?.name || null,
    };
  });

  console.table(matched);
  fs.writeFileSync("scripts/mapped_laliga_clubs.json", JSON.stringify(matched, null, 2), "utf-8");

  await prisma.$disconnect();
  await pool.end();
}

mapLaLiga().catch(console.error);
