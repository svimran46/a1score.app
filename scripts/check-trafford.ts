import { fotmobFetch } from "../src/lib/fotmob/client";

async function main() {
  const teams = [
    { name: "Burnley", id: 8122 },
    { name: "Wolves", id: 8654 },
    { name: "West Ham", id: 8657 },
    { name: "Crystal Palace", id: 9826 },
    { name: "Brighton", id: 10204 },
    { name: "Bournemouth", id: 8678 },
    { name: "Brentford", id: 9937 },
    { name: "Fulham", id: 9879 },
    { name: "Leicester", id: 8152 },
    { name: "Ipswich", id: 9406 },
    { name: "Southampton", id: 8466 },
    { name: "Nottingham Forest", id: 10203 },
    { name: "Man City", id: 8456 }
  ];

  for (const t of teams) {
    try {
      const data = await fotmobFetch<any>(`/api/data/teams?id=${t.id}`);
      const members = (data?.squad?.squad || []).flatMap((g: any) => g.members || []);
      const found = members.find((m: any) => m.name.toLowerCase().includes("trafford"));
      if (found) {
        console.log(`MATCH: James Trafford IS IN SQUAD OF ${t.name} (FotMob ID: ${t.id}) -> Member: ${found.name}, shirt #${found.shirtNumber}, id=${found.id}`);
      }
    } catch {}
  }
}

main().catch(console.error);
