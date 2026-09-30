import { fotmobFetch } from "../src/lib/fotmob/client";

const PLAYERS = [
  "Omar Marmoush",
  "James Trafford",
  "Jack Grealish"
];

const MORE_TEAMS = [
  { name: "Manchester City", id: 8456 },
  { name: "Everton", id: 8668 },
  { name: "Aston Villa", id: 10252 },
  { name: "Newcastle", id: 10261 },
  { name: "Tottenham", id: 8586 },
  { name: "Arsenal", id: 9825 },
  { name: "Bayern Munich", id: 9823 },
  { name: "Bayer Leverkusen", id: 8178 },
  { name: "Borussia Dortmund", id: 9789 },
  { name: "Juventus", id: 9885 },
  { name: "AC Milan", id: 8564 },
  { name: "Atletico Madrid", id: 9906 }
];

async function main() {
  console.log("=== Checking Marmoush, Trafford, Grealish ===");
  for (const team of MORE_TEAMS) {
    try {
      const data = await fotmobFetch<any>(`/api/data/teams?id=${team.id}`);
      const members = (data?.squad?.squad || []).flatMap((g: any) => g.members || []);
      for (const p of PLAYERS) {
        const found = members.find((m: any) => m.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(m.name.toLowerCase()));
        if (found) {
          console.log(`MATCH in FotMob: ${p} IS IN SQUAD OF ${team.name} (FotMob ID: ${team.id}) -> Member: ${found.name}, shirt #${found.shirtNumber}, id=${found.id}`);
        }
      }
    } catch {}
  }
}

main().catch(console.error);
