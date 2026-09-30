import { fotmobFetch } from "../src/lib/fotmob/client";

async function main() {
  console.log("Checking FotMob 8564 and 8636:");
  const fm8564 = await fotmobFetch<any>("/api/data/teams?id=8564");
  console.log("8564 details:", fm8564?.details?.name, fm8564?.details?.shortName);
  const fm8636 = await fotmobFetch<any>("/api/data/teams?id=8636");
  console.log("8636 details:", fm8636?.details?.name, fm8636?.details?.shortName);
}

main().catch(console.error);
