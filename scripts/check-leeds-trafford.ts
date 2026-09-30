import { fotmobFetch } from "../src/lib/fotmob/client";

async function main() {
  const data = await fotmobFetch<any>("/api/data/teams?id=8463");
  console.log("Leeds United FotMob squad:");
  const members = (data?.squad?.squad || []).flatMap((g: any) => g.members || []);
  const found = members.find((m: any) => m.name.toLowerCase().includes("trafford"));
  if (found) {
    console.log(`FOUND in Leeds United FotMob squad: ${found.name}, shirt #${found.shirtNumber}, id=${found.id}`);
  } else {
    console.log("Not found in Leeds squad members. Keepers:", (data?.squad?.squad || []).find((g: any) => g.title === "keepers"));
  }
}

main().catch(console.error);
