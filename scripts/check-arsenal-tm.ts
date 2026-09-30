import { parseTmSquadDetailed } from "./parse-tm-squad-detailed";

async function main() {
  const url = "https://www.transfermarkt.com/fc-arsenal/startseite/verein/11/saison_id/2026";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const squad = parseTmSquadDetailed(html);
  console.log(`Arsenal squad size: ${squad.length}`);
  for (const p of squad) {
    console.log(`${p.name} (TM ${p.tmId}, ${p.pos}, MV: ${p.mvRaw})`);
  }
}

main().catch(console.error);
