import fs from "fs";

async function inspectHtml() {
  const res = await fetch("https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1/saison_id/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  fs.writeFileSync("scripts/gb1_2026.html", html, "utf-8");

  // find sample hrefs with verein
  const matches = [...html.matchAll(/href="([^"]*verein[^"]*)"/g)];
  console.log(`Found ${matches.length} verein hrefs.`);
  const samples = matches.slice(0, 30).map((m) => m[1]);
  console.log("Sample hrefs:", samples);
}

inspectHtml().catch(console.error);
