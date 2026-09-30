import fs from "fs";
import { parseTmSquad, TmPlayer } from "./test-liverpool-parser";

interface ClubItem {
  tmId: string;
  tmName: string;
  squadUrl: string;
  dbId: string;
  dbName: string;
}

async function testFetchAllSquads() {
  const clubs: ClubItem[] = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  
  // Exclude Arsenal (11) and Chelsea (631) as they are already completed
  const remaining = clubs.filter((c) => c.tmId !== "11" && c.tmId !== "631");
  console.log(`Auditing remaining ${remaining.length} clubs on Transfermarkt...`);

  const results: Record<string, TmPlayer[]> = {};

  for (const c of remaining) {
    console.log(`\nFetching ${c.tmName} (TM ID: ${c.tmId}) from ${c.squadUrl}...`);
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
      const squad = parseTmSquad(html);
      console.log(`✅ Parsed ${squad.length} players for ${c.tmName}`);
      results[c.tmId] = squad;
      // Brief pause to be respectful to the server
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`❌ Error fetching ${c.tmName}:`, err);
    }
  }

  fs.writeFileSync("scripts/tm_epl_all_squads_2026.json", JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nAll ${Object.keys(results).length} squads fetched and saved to scripts/tm_epl_all_squads_2026.json`);
}

testFetchAllSquads().catch(console.error);
