import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) throw new Error("No DIRECT_URL or DATABASE_URL");
const pool = new Pool({
  connectionString: directUrl.replace(/[?&]sslmode=[^&]*/, ""),
  ssl: { rejectUnauthorized: false },
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const overviewUrl = "https://www.transfermarkt.com/liga-portugal/startseite/wettbewerb/PO1/saison_id/2026";
  console.log("Fetching Liga Portugal from", overviewUrl);
  const res = await fetch(overviewUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  console.log(`Found ${tmClubs.length} TM clubs.`);
  const allDbClubs = await prisma.club.findMany({ include: { league: true } });
  console.log(`DB has ${allDbClubs.length} total clubs across all leagues.`);

  for (const tm of tmClubs) {
    let match = allDbClubs.find((c) => c.transfermarktId === tm.tmId);
    if (!match) {
      match = allDbClubs.find((c) => c.name.toLowerCase() === tm.tmName.toLowerCase());
    }
    if (!match) {
      match = allDbClubs.find(
        (c) =>
          c.name.toLowerCase().includes(tm.tmName.toLowerCase()) ||
          tm.tmName.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    console.log(
      match
        ? `✅ [MATCH] TM: "${tm.tmName}" (${tm.tmId}) -> DB: "${match.name}" (${match.id}) League: ${match.league?.name}`
        : `❌ [MISSING] TM: "${tm.tmName}" (${tm.tmId})`
    );
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
