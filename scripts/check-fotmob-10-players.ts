import { fotmobFetch } from "../src/lib/fotmob/client";

const PLAYERS = [
  { name: "Rodri", tmId: "357565" },
  { name: "Bernardo Silva", tmId: "241641" },
  { name: "Ibrahima Konaté", tmId: "357119" },
  { name: "Marc Cucurella", tmId: "284857" },
  { name: "Bradley Barcola", tmId: "708265" },
  { name: "John Stones", tmId: "186590" },
  { name: "Manuel Akanji", tmId: "284730" },
  { name: "Omar Marmoush", tmId: "445939" },
  { name: "James Trafford", tmId: "566799" },
  { name: "Jack Grealish", tmId: "203460" }
];

async function main() {
  console.log("=== Querying FotMob Squad Data for 10 Spot-Check Players ===");
  // We can search FotMob API /api/data/search/suggest?term=...
  for (const p of PLAYERS) {
    try {
      const res = await fotmobFetch<any>(`/api/data/search/suggest?term=${encodeURIComponent(p.name)}`);
      // Find player suggestion
      const hit = res?.squadMemberSuggest?.find((s: any) => s.options?.some((o: any) => o.text?.toLowerCase().includes(p.name.toLowerCase()))) ||
                  res?.teamOrPlayerSuggest?.find((s: any) => s.options?.some((o: any) => o.type === "player" && o.text?.toLowerCase().includes(p.name.toLowerCase())));
      
      const opt = hit?.options?.[0] || res?.teamOrPlayerSuggest?.[0]?.options?.[0];
      console.log(`\nPlayer: ${p.name}`);
      if (opt) {
        console.log(`  FotMob Option: text="${opt.text}", desc="${opt.desc || opt.description}", payload=${JSON.stringify(opt.payload)}`);
      } else {
        console.log(`  No suggest hit. Searching top teams squads...`);
      }
    } catch (e: any) {
      console.log(`  Error querying FotMob for ${p.name}:`, e.message);
    }
  }

  // Also check Man City, Liverpool, Barcelona, Chelsea, PSG, Inter squads directly!
  const teamsToCheck = [
    { name: "Manchester City", id: 8456 },
    { name: "FC Barcelona", id: 8634 },
    { name: "Liverpool", id: 8650 },
    { name: "Chelsea", id: 8455 },
    { name: "Paris Saint-Germain", id: 9847 },
    { name: "Inter Milan", id: 8636 },
    { name: "Real Madrid", id: 8633 },
    { name: "Bayern Munich", id: 9823 },
    { name: "Arsenal", id: 9825 }
  ];

  console.log("\n=== Checking Team Squads in FotMob for Target Players ===");
  for (const team of teamsToCheck) {
    const data = await fotmobFetch<any>(`/api/data/teams?id=${team.id}`);
    const members = (data?.squad?.squad || []).flatMap((g: any) => g.members || []);
    for (const p of PLAYERS) {
      const found = members.find((m: any) => m.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(m.name.toLowerCase()));
      if (found) {
        console.log(`MATCH in FotMob: ${p.name} IS IN SQUAD OF ${team.name} (FotMob ID: ${team.id}) -> Member: ${found.name}, shirt #${found.shirtNumber}`);
      }
    }
  }
}

main().catch(console.error);
