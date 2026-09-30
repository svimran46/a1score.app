import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

const PLAYERS = [
  { name: "Josh Wilson-Esbrand", id: "FM_1187225", club: "Manchester City" },
  { name: "Allan", id: "FM_1721789", club: "Manchester City" },
  { name: "Christos Tzolis", id: "FM_1157237", club: "Arsenal FC" },
  { name: "João Cancelo", id: "FM_361757", club: "FC Barcelona" },
  { name: "Brian Fariñas", id: "FM_1821727", club: "FC Barcelona" },
  { name: "Jesse Bisiwu", id: "FM_1656591", club: "FC Barcelona" },
  { name: "Hamza Abdelkarim", id: "FM_1708842", club: "FC Barcelona" },
  { name: "Bara Ndiaye", id: "FM_1798782", club: "Bayern Munich" },
  { name: "Alessandro Longoni", id: "FM_1662399", club: "Paris Saint-Germain" },
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
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("=== Checking if 9 'Create New Player' rows already exist in DB ===");

  for (const p of PLAYERS) {
    const norm = normalizeName(p.name);
    const resExact = await client.query(
      `SELECT id, "fullName", "currentClubId", status, "transfermarktId" FROM "Player" WHERE "fullName" ILIKE $1`,
      [p.name]
    );

    let resFuzzy: any[] = [];
    if (resExact.rows.length === 0) {
      const parts = norm.split(" ");
      if (parts.length >= 2) {
        const fuzzyRes = await client.query(
          `SELECT id, "fullName", "currentClubId", status, "transfermarktId" FROM "Player" WHERE "fullName" ILIKE $1 AND "fullName" ILIKE $2`,
          [`%${parts[0]}%`, `%${parts[parts.length - 1]}%`]
        );
        resFuzzy = fuzzyRes.rows;
      }
    }

    const matches = resExact.rows.length > 0 ? resExact.rows : resFuzzy;
    if (matches.length > 0) {
      console.log(`- ${p.name} (${p.id}, target: ${p.club}): YES (Found ${matches.length} matches)`);
      for (const m of matches) {
        console.log(`    DB: [${m.id}] "${m.fullName}", clubId: ${m.currentClubId}, status: ${m.status}, tmId: ${m.transfermarktId}`);
      }
    } else {
      console.log(`- ${p.name} (${p.id}, target: ${p.club}): NO (Does not exist in DB)`);
    }
  }

  await client.end();
}

main().catch(console.error);
