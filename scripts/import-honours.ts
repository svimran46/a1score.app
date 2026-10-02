import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALIASES: Record<string, string> = {
  "burnley": "Burnley FC",
  "burnley fc": "Burnley FC",
  "sheffield utd": "Sheffield United",
  "sheffield united": "Sheffield United",
  "west brom": "West Bromwich Albion",
  "west bromwich": "West Bromwich Albion",
  "west bromwich albion": "West Bromwich Albion",
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
  "leicester": "Leicester City",
  "leicester city": "Leicester City",
  "huddersfield": "Huddersfield Town",
  "huddersfield town": "Huddersfield Town",
  "man city": "Manchester City",
  "manchester city": "Manchester City",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "manchester united": "Manchester United",
  "spurs": "Tottenham Hotspur",
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "arsenal": "Arsenal",
  "chelsea": "Chelsea",
  "liverpool": "Liverpool",
  "everton": "Everton",
  "aston villa": "Aston Villa",
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "sunderland": "Sunderland",
  "ipswich": "Ipswich Town",
  "ipswich town": "Ipswich Town",
  "nottingham forest": "Nottingham Forest",
  "leeds": "Leeds United",
  "leeds united": "Leeds United",
};

async function importPremierLeagueHonours() {
  console.log("=== Importing Premier League Honours ===");

  // 1. Ensure Competition row exists
  const compKey = "premier-league";
  const compLabel = "English league titles";

  const comp = await prisma.competition.upsert({
    where: { key: compKey },
    update: { label: compLabel },
    create: {
      key: compKey,
      label: compLabel,
    },
  });
  console.log(`Competition upserted: ${comp.key} ("${comp.label}")`);

  // 2. Load all clubs from database for mapping
  const allClubs = await prisma.club.findMany({
    select: { id: true, name: true, transfermarktId: true },
  });
  const clubById = new Map<string, typeof allClubs[0]>(allClubs.map((c) => [c.id, c]));
  const clubByName = new Map<string, typeof allClubs[0]>(
    allClubs.map((c) => [c.name.toLowerCase().trim(), c])
  );

  // 3. Read data/winners/premier-league.csv
  const csvPath = path.resolve(process.cwd(), "data/winners/premier-league.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`File not found: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).filter((l) => l.trim().length > 0);

  console.log(`Processing ${rows.length} winners records from ${csvPath}...`);

  let matchedClubCount = 0;
  let externalClubCount = 0;

  for (const line of rows) {
    // Parse CSV line handling potential quotes if any
    const parts = line.split(",").map((p) => p.trim());
    const [cKey, season, seasonEndYearStr, clubName, providedClubId, source, verifiedAtStr, note] = parts;

    let finalClubId: string | null = null;
    let isExternal = false;

    // Check provided club_id first
    if (providedClubId && clubById.has(providedClubId)) {
      finalClubId = providedClubId;
    } else {
      // Try exact name match
      const lowerName = clubName.toLowerCase();
      if (clubByName.has(lowerName)) {
        finalClubId = clubByName.get(lowerName)!.id;
      } else if (ALIASES[lowerName] && clubByName.has(ALIASES[lowerName].toLowerCase())) {
        // Try alias match
        finalClubId = clubByName.get(ALIASES[lowerName].toLowerCase())!.id;
      } else {
        // Unmatched -> store as external (do not fail)
        finalClubId = null;
        isExternal = true;
      }
    }

    if (isExternal) {
      externalClubCount++;
    } else {
      matchedClubCount++;
    }

    await prisma.competitionWinner.upsert({
      where: {
        competitionKey_season: {
          competitionKey: cKey,
          season: season,
        },
      },
      update: {
        seasonEndYear: parseInt(seasonEndYearStr, 10),
        clubName: clubName,
        clubId: finalClubId,
        isExternal: isExternal,
        source: source || null,
        verifiedAt: verifiedAtStr ? new Date(verifiedAtStr) : null,
        note: note || null,
      },
      create: {
        competitionKey: cKey,
        season: season,
        seasonEndYear: parseInt(seasonEndYearStr, 10),
        clubName: clubName,
        clubId: finalClubId,
        isExternal: isExternal,
        source: source || null,
        verifiedAt: verifiedAtStr ? new Date(verifiedAtStr) : null,
        note: note || null,
      },
    });
  }

  console.log(`Import complete! Total rows: ${rows.length}`);
  console.log(`Matched to internal clubs: ${matchedClubCount}`);
  console.log(`Stored as external: ${externalClubCount}`);
}

importPremierLeagueHonours()
  .catch((err) => {
    console.error("Error importing honours:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
