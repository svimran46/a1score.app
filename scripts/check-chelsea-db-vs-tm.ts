import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CHELSEA_ID = "cmuihqcpo00b1h29edf8q9ksb";

const tmChelseaSquad = [
  { tmId: "834397", name: "Mike Penders" },
  { tmId: "111873", name: "Emiliano Martínez" },
  { tmId: "656316", name: "Gabriel Slonina" },
  { tmId: "731466", name: "Teddy Sharman-Lowe" },
  { tmId: "434224", name: "Maxence Lacroix" },
  { tmId: "614258", name: "Levi Colwill" },
  { tmId: "475411", name: "Wesley Fofana" },
  { tmId: "1004708", name: "Josh Acheampong" },
  { tmId: "1145504", name: "Aarón Anselmino" },
  { tmId: "904802", name: "Jorrel Hato" },
  { tmId: "596122", name: "Pep Chavarría" },
  { tmId: "472423", name: "Reece James" },
  { tmId: "895937", name: "Marco Palestra" },
  { tmId: "620322", name: "Malo Gusto" },
  { tmId: "687626", name: "Moisés Caicedo" },
  { tmId: "628451", name: "Roméo Lavia" },
  { tmId: "849410", name: "Valentín Barco" },
  { tmId: "61651", name: "Jordan Henderson" },
  { tmId: "503743", name: "Morgan Rogers" },
  { tmId: "568177", name: "Cole Palmer" },
  { tmId: "670882", name: "Jamie Gittens" },
  { tmId: "1056993", name: "Estêvão" },
  { tmId: "487465", name: "Pedro Neto" },
  { tmId: "1138758", name: "Geovany Quenda" },
  { tmId: "626724", name: "João Pedro" },
  { tmId: "559328", name: "Emmanuel Emegha" },
  { tmId: "67063", name: "Danny Welbeck" },
];

async function main() {
  const currentDbChelsea = await prisma.player.findMany({
    where: { currentClubId: CHELSEA_ID },
  });
  console.log(`Current DB Chelsea roster: ${currentDbChelsea.length} players`);

  // Check each of the 27 TM players in the entire database
  const tmIds = tmChelseaSquad.map((t) => t.tmId);
  const dbMatchedByTm = await prisma.player.findMany({
    where: {
      OR: [
        { transfermarktId: { in: tmIds } },
        { currentClubId: CHELSEA_ID },
      ],
    },
    include: { currentClub: true },
  });

  const dbByTm = new Map<string, any>(dbMatchedByTm.filter(p => p.transfermarktId).map((p) => [p.transfermarktId!, p]));

  console.log("\n--- STATUS OF THE 27 TRANSFERMARKT PLAYERS IN DATABASE ---");
  for (const t of tmChelseaSquad) {
    const p = dbByTm.get(t.tmId);
    if (!p) {
      console.log(`❌ [NOT IN DB] ${t.name} (TM ${t.tmId})`);
    } else if (p.currentClubId === CHELSEA_ID) {
      console.log(`✅ [ALREADY AT CHELSEA] ${p.fullName} (ID: ${p.id}, TM: ${t.tmId})`);
    } else {
      console.log(`🔄 [AT OTHER CLUB / DETACHED] ${p.fullName} (ID: ${p.id}, TM: ${t.tmId}) -> Currently at: ${p.currentClub?.name || "Unassigned"}`);
    }
  }

  // Check which players currently in DB at Chelsea are NOT in the 27 TM list
  const tmIdSet = new Set(tmIds);
  const extraInDb = currentDbChelsea.filter((p) => !p.transfermarktId || !tmIdSet.has(p.transfermarktId));
  console.log(`\n--- PLAYERS CURRENTLY IN DB AT CHELSEA BUT ABSENT FROM 27 TM SQUAD (${extraInDb.length}) ---`);
  for (const p of extraInDb) {
    console.log(`- ${p.fullName} (ID: ${p.id}, TM: ${p.transfermarktId || "N/A"}, MV: ${p.latestMarketValue})`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
