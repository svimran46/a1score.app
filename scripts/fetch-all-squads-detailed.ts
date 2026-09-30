import fs from "fs";
import { parseTmSquadDetailed, TmPlayerDetails } from "./parse-tm-squad-detailed";

interface ClubItem {
  tmId: string;
  tmName: string;
  squadUrl: string;
  dbId: string;
  dbName: string;
}

async function fetchAllDetailed() {
  const clubs: ClubItem[] = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  
  // Exclude Arsenal (11) and Chelsea (631)
  const remaining = clubs.filter((c) => c.tmId !== "11" && c.tmId !== "631");
  console.log(`Fetching detailed TM squads for ${remaining.length} clubs...`);

  const results: Record<string, TmPlayerDetails[]> = {};

  for (const c of remaining) {
    console.log(`Fetching ${c.tmName} (TM ID: ${c.tmId})...`);
    try {
      const res = await fetch(c.squadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!res.ok) {
        console.error(`❌ HTTP ${res.status} for ${c.tmName}`);
        continue;
      }
      const html = await res.text();
      const squad = parseTmSquadDetailed(html);
      console.log(`✅ Parsed ${squad.length} players for ${c.tmName}`);
      results[c.tmId] = squad;
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`❌ Error fetching ${c.tmName}:`, err);
    }
  }

  fs.writeFileSync(
    "scripts/tm_epl_all_squads_detailed_2026.json",
    JSON.stringify(
      results,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );
  console.log(`\nAll ${Object.keys(results).length} detailed squads saved to scripts/tm_epl_all_squads_detailed_2026.json`);
}

fetchAllDetailed().catch(console.error);
