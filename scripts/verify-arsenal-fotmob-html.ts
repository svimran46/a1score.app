import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ARSENAL_ID = "cmuiho5do001hb23froc57owj";

const htmlSquad = [
  { name: "David Raya", shirt: 1, pos: "GK" },
  { name: "Kepa Arrizabalaga", shirt: 13, pos: "GK" },
  { name: "Illan Meslier", shirt: 30, pos: "GK" },
  { name: "William Saliba", shirt: 2, pos: "CB" },
  { name: "Cristhian Mosquera", shirt: 3, pos: "CB, RB" },
  { name: "Ben White", shirt: 4, pos: "RB" },
  { name: "Piero Hincapié", shirt: 5, pos: "LB, CB" },
  { name: "Gabriel", shirt: 6, pos: "CB" },
  { name: "Jurriën Timber", shirt: 12, pos: "RB, CB, LB" },
  { name: "Ezri Konsa", shirt: 15, pos: "CB, RB" },
  { name: "Riccardo Calafiori", shirt: 33, pos: "LB, CB" },
  { name: "Myles Lewis-Skelly", shirt: 49, pos: "LB, DM, CM" },
  { name: "Martin Ødegaard", shirt: 8, pos: "CM, AM" },
  { name: "Eberechi Eze", shirt: 10, pos: "AM, CM, LW, DM" },
  { name: "Mikel Merino", shirt: 23, pos: "CM, ST, DM" },
  { name: "Martín Zubimendi", shirt: 36, pos: "DM, CM, RB" },
  { name: "Bruno Guimarães", shirt: 39, pos: "CM, DM, AM" },
  { name: "Declan Rice", shirt: 41, pos: "DM, CM" },
  { name: "Max Dowman", shirt: 56, pos: "RW, AM, CM" },
  { name: "Bukayo Saka", shirt: 7, pos: "RW, AM" },
  { name: "Viktor Gyökeres", shirt: 14, pos: "ST" },
  { name: "Christos Tzolis", shirt: 17, pos: "LW, AM, RW, LM" },
  { name: "Noni Madueke", shirt: 20, pos: "RW" },
  { name: "Kai Havertz", shirt: 29, pos: "ST, AM, CM" },
];

async function main() {
  const currentDbPlayers = await prisma.player.findMany({
    where: { currentClubId: ARSENAL_ID },
  });

  console.log(`Current DB players at Arsenal (${currentDbPlayers.length}):`);
  for (const p of currentDbPlayers) {
    console.log(`- ${p.fullName} (ID: ${p.id}, TM: ${p.transfermarktId})`);
  }

  console.log(`\nFotMob HTML Squad Count: ${htmlSquad.length}`);
  
  // Find which ones in DB are NOT in FotMob HTML
  const htmlNames = new Set(htmlSquad.map((h) => h.name.toLowerCase()));
  const extraInDb = currentDbPlayers.filter((p) => {
    const fn = p.fullName.toLowerCase();
    return !htmlSquad.some((h) => fn.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(fn));
  });

  console.log(`\nExtra players in DB not in FotMob HTML (${extraInDb.length}):`);
  for (const p of extraInDb) {
    console.log(`- ${p.fullName} (ID: ${p.id})`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
