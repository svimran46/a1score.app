import { fotmobFetch } from "../src/lib/fotmob/client";

async function main() {
  console.log("Fetching Arsenal from FotMob...");
  const data = await fotmobFetch<any>("/api/data/teams?id=9825", 0);
  console.log("Keys in data:", Object.keys(data || {}));
  if (data?.squad) {
    console.log("Squad structure:", Object.keys(data.squad));
    if (data.squad.squad) {
      console.log("Groups in squad.squad:", data.squad.squad.map((g: any) => g.title));
      const firstGroup = data.squad.squad[0];
      console.log("First member in first group:", firstGroup.members?.[0]);
    }
  }
}

main().catch(console.error);
