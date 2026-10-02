import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALIASES: Record<string, string> = {
  // English clubs
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

  // Champions League European clubs
  "real madrid": "Real Madrid",
  "ac milan": "AC Milan",
  "milan": "AC Milan",
  "inter": "Internazionale",
  "inter milan": "Internazionale",
  "internazionale": "Internazionale",
  "bayern": "Bayern Munich",
  "bayern munich": "Bayern Munich",
  "fc bayern münchen": "Bayern Munich",
  "barcelona": "FC Barcelona",
  "fc barcelona": "FC Barcelona",
  "ajax": "Ajax",
  "afc ajax": "Ajax",
  "juventus": "Juventus",
  "porto": "FC Porto",
  "fc porto": "FC Porto",
  "benfica": "SL Benfica",
  "sl benfica": "SL Benfica",
  "dortmund": "Borussia Dortmund",
  "borussia dortmund": "Borussia Dortmund",
  "feyenoord": "Feyenoord",
  "hsv": "Hamburger SV",
  "hamburger sv": "Hamburger SV",
  "marseille": "Olympique Marseille",
  "olympique marseille": "Olympique Marseille",
  "psv": "PSV Eindhoven",
  "psv eindhoven": "PSV Eindhoven",
  "psg": "Paris Saint-Germain",
  "paris saint-germain": "Paris Saint-Germain",

  // Spanish clubs
  "atletico de madrid": "Atlético de Madrid",
  "atlético de madrid": "Atlético de Madrid",
  "atletico madrid": "Atlético de Madrid",
  "atlético aviación": "Atlético de Madrid",
  "atletico aviacion": "Atlético de Madrid",
  "athletic bilbao": "Athletic Bilbao",
  "athletic club": "Athletic Bilbao",
  "athletic de bilbao": "Athletic Bilbao",
  "real betis": "Real Betis Balompié",
  "real betis balompié": "Real Betis Balompié",
  "betis": "Real Betis Balompié",
  "valencia": "Valencia CF",
  "valencia cf": "Valencia CF",
  "sevilla": "Sevilla FC",
  "sevilla fc": "Sevilla FC",
  "real sociedad": "Real Sociedad",
  "deportivo": "Deportivo de La Coruña",
  "deportivo la coruña": "Deportivo de La Coruña",
  "deportivo de la coruña": "Deportivo de La Coruña",
  "rc deportivo de la coruña": "Deportivo de La Coruña",

  // German clubs
  "1. fc nürnberg": "1.FC Nuremberg",
  "1. fc nurnberg": "1.FC Nuremberg",
  "1.fc nürnberg": "1.FC Nuremberg",
  "1.fc nurnberg": "1.FC Nuremberg",
  "nürnberg": "1.FC Nuremberg",
  "nuremberg": "1.FC Nuremberg",
  "1. fc köln": "1.FC Köln",
  "1. fc koln": "1.FC Köln",
  "1.fc koln": "1.FC Köln",
  "köln": "1.FC Köln",
  "koln": "1.FC Köln",
  "schalke": "FC Schalke 04",
  "schalke 04": "FC Schalke 04",
  "fc schalke 04": "FC Schalke 04",
  "werder bremen": "SV Werder Bremen",
  "sv werder bremen": "SV Werder Bremen",
  "bremen": "SV Werder Bremen",
  "stuttgart": "VfB Stuttgart",
  "vfb stuttgart": "VfB Stuttgart",
  "borussia mönchengladbach": "Borussia Mönchengladbach",
  "borussia monchengladbach": "Borussia Mönchengladbach",
  "vfl borussia mönchengladbach": "Borussia Mönchengladbach",
  "mönchengladbach": "Borussia Mönchengladbach",
  "spvgg greuther fürth": "SpVgg Greuther Fürth",
  "spvgg fürth": "SpVgg Greuther Fürth",
  "greuther fürth": "SpVgg Greuther Fürth",
  "spvgg fuerth": "SpVgg Greuther Fürth",
  "hannover": "Hannover 96",
  "hannover 96": "Hannover 96",
  "hannoverscher sv 96": "Hannover 96",
  "hertha": "Hertha BSC",
  "hertha bsc": "Hertha BSC",
  "hertha bsc berlin": "Hertha BSC",
  "hertha berlin": "Hertha BSC",
  "eintracht braunschweig": "Eintracht Braunschweig",
  "braunschweiger tsv eintracht": "Eintracht Braunschweig",
  "braunschweig": "Eintracht Braunschweig",
  "eintracht frankfurt": "Eintracht Frankfurt",
  "frankfurt": "Eintracht Frankfurt",
  "fortuna düsseldorf": "Fortuna Düsseldorf",
  "fortuna dusseldorf": "Fortuna Düsseldorf",
  "düsseldorf": "Fortuna Düsseldorf",
  "holstein kiel": "Holstein Kiel",
  "fv holstein kiel": "Holstein Kiel",
  "kiel": "Holstein Kiel",
  "kieler sv holstein": "Holstein Kiel",
  "bayer 04 leverkusen": "Bayer 04 Leverkusen",
  "bayer leverkusen": "Bayer 04 Leverkusen",
  "leverkusen": "Bayer 04 Leverkusen",
  "vfl wolfsburg": "VfL Wolfsburg",
  "wolfsburg": "VfL Wolfsburg",
};

interface ImportCompetitionConfig {
  key: string;
  label: string;
  note?: string;
  csvFile: string;
}

async function importCompetition(config: ImportCompetitionConfig) {
  console.log(`\n=== Importing Competition: ${config.key} ("${config.label}") ===`);

  // 1. Ensure Competition row exists
  const comp = await prisma.competition.upsert({
    where: { key: config.key },
    update: {
      label: config.label,
      note: config.note || null,
    },
    create: {
      key: config.key,
      label: config.label,
      note: config.note || null,
    },
  });
  console.log(`Competition upserted: ${comp.key} ("${comp.label}", note: "${comp.note || ''}")`);

  // 2. Load all clubs from database for mapping
  const allClubs = await prisma.club.findMany({
    select: { id: true, name: true, transfermarktId: true },
  });
  const clubById = new Map<string, typeof allClubs[0]>(allClubs.map((c) => [c.id, c]));
  const clubByName = new Map<string, typeof allClubs[0]>(
    allClubs.map((c) => [c.name.toLowerCase().trim(), c])
  );

  // 3. Read CSV
  const csvPath = path.resolve(process.cwd(), config.csvFile);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`File not found: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n");
  const rows = lines.slice(1).filter((l) => l.trim().length > 0);

  console.log(`Processing ${rows.length} winners records from ${csvPath}...`);

  let matchedClubCount = 0;
  let externalClubCount = 0;

  for (const line of rows) {
    const parts = line.split(",").map((p) => p.trim());
    const [cKey, season, seasonEndYearStr, clubName, providedClubId, source, verifiedAtStr, note] = parts;

    let finalClubId: string | null = null;
    let isExternal = false;

    // Check provided club_id first
    if (providedClubId && clubById.has(providedClubId)) {
      finalClubId = providedClubId;
    } else {
      const lowerName = clubName.toLowerCase();
      if (clubByName.has(lowerName)) {
        finalClubId = clubByName.get(lowerName)!.id;
      } else if (ALIASES[lowerName] && clubByName.has(ALIASES[lowerName].toLowerCase())) {
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

  console.log(`Import complete for ${config.key}! Total rows: ${rows.length}`);
  console.log(`Matched to internal clubs: ${matchedClubCount}`);
  console.log(`Stored as external: ${externalClubCount}`);
}

async function main() {
  // 1. Premier League
  await importCompetition({
    key: "premier-league",
    label: "English league titles",
    csvFile: "data/winners/premier-league.csv",
  });

  // 2. Champions League
  await importCompetition({
    key: "champions-league",
    label: "Champions League",
    note: "Includes European Cup, 1955/56 to 1991/92",
    csvFile: "data/winners/champions-league.csv",
  });

  // 3. LaLiga
  await importCompetition({
    key: "la-liga",
    label: "Spanish league titles",
    note: "Includes Atlético Aviación (1939/40, 1940/41)",
    csvFile: "data/winners/la-liga.csv",
  });

  // 4. Bundesliga
  await importCompetition({
    key: "bundesliga",
    label: "German league titles",
    note: "Includes German Championship finals (1903–1963) and Bundesliga (since 1963/64)",
    csvFile: "data/winners/bundesliga.csv",
  });
}

main()
  .catch((err) => {
    console.error("Error importing honours:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
