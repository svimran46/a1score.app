import { fotmobFetch } from "../src/lib/fotmob/client";

async function main() {
  console.log("=== Inspecting FotMob Squad Data Structure ===");
  // Man City = 8456
  const data = await fotmobFetch<any>("/api/data/teams?id=8456");
  console.log("Team details:", data?.details?.name);
  console.log("Squad title groups:", data?.squad?.squad?.map((g: any) => ({ title: g.title, count: g.members?.length })));

  if (data?.squad?.squad) {
    for (const group of data.squad.squad) {
      console.log(`\nGroup: ${group.title}`);
      for (const m of (group.members || []).slice(0, 3)) {
        console.log(`  - id: ${m.id}, name: "${m.name}", cname: "${m.cname}", role: ${m.role?.key}, shirtNumber: ${m.shirtNumber}, marketValue: ${m.marketValue}`);
      }
    }
  }
}

main().catch(console.error);
