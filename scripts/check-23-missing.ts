import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const missing = [
  { club: "Manchester United", tmId: "503883", name: "Senne Lammens" },
  { club: "Newcastle United", tmId: "923757", name: "Ewen Jaouen" },
  { club: "Brighton & Hove Albion", tmId: "750903", name: "Jaouen Hadjam" },
  { club: "Brighton & Hove Albion", tmId: "539252", name: "Costinha" },
  { club: "Brighton & Hove Albion", tmId: "1421433", name: "Zadok Yohanna" },
  { club: "Brighton & Hove Albion", tmId: "703408", name: "Femi Azeez" },
  { club: "Brighton & Hove Albion", tmId: "888785", name: "Promise David" },
  { club: "Brentford FC", tmId: "915418", name: "Jannik Schuster" },
  { club: "Brentford FC", tmId: "1071138", name: "Benjamin Fredrick" },
  { club: "Brentford FC", tmId: "1011936", name: "Kaye Furo" },
  { club: "Crystal Palace", tmId: "945021", name: "Anan Khalaili" },
  { club: "Crystal Palace", tmId: "881116", name: "Darío Osorio" },
  { club: "Crystal Palace", tmId: "1007383", name: "Zavier Gozo" },
  { club: "AFC Bournemouth", tmId: "471690", name: "Max Aarons" },
  { club: "AFC Bournemouth", tmId: "746740", name: "Daniel Jebbison" },
  { club: "Aston Villa", tmId: "1282860", name: "Modou Kéba Cissé" },
  { club: "Aston Villa", tmId: "331726", name: "Tammy Abraham" },
  { club: "Sunderland AFC", tmId: "1401779", name: "Jules Ahoka" },
  { club: "Sunderland AFC", tmId: "277697", name: "Alan Browne" },
  { club: "Sunderland AFC", tmId: "903611", name: "Nilson Angulo" },
  { club: "Fulham FC", tmId: "817613", name: "Alex Borto" },
  { club: "Fulham FC", tmId: "900195", name: "Kevin" },
  { club: "Everton FC", tmId: "538216", name: "Hayden Hackney" },
];

async function main() {
  console.log("Searching entire database for 23 'missing' players...");

  for (const m of missing) {
    // 1. By TM ID
    let found = await prisma.player.findMany({
      where: { transfermarktId: m.tmId },
      include: { currentClub: true },
    });

    if (found.length > 0) {
      console.log(`[FOUND BY TM ${m.tmId}] ${m.name} -> ${found.map(p => `${p.fullName} (Club: ${p.currentClub?.name || 'Unassigned'}, ID: ${p.id})`).join("; ")}`);
      continue;
    }

    // 2. By name (case-insensitive substring or match)
    found = await prisma.player.findMany({
      where: {
        fullName: { contains: m.name.split(" ").slice(-1)[0], mode: "insensitive" },
      },
      include: { currentClub: true },
    });

    // filter closer match
    const close = found.filter(p => p.fullName.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(p.fullName.toLowerCase()));

    if (close.length > 0) {
      console.log(`[FOUND BY NAME for ${m.name}] -> ${close.map(p => `${p.fullName} (Club: ${p.currentClub?.name || 'Unassigned'}, ID: ${p.id}, TM: ${p.transfermarktId})`).join("; ")}`);
    } else {
      console.log(`[NOT IN DB AT ALL] ${m.name} (TM ${m.tmId}) for ${m.club}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
