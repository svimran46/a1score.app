import fs from "fs";

async function inspectFullRow() {
  const res = await fetch("https://www.transfermarkt.com/fc-liverpool/startseite/verein/31/saison_id/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const rows = html.split(/<tr class="(?:odd|even)">/);
  console.log("Full chunk of first player:");
  console.log(rows[1]);
}

inspectFullRow().catch(console.error);
