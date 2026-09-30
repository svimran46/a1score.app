import fs from "fs";

async function fetchEpl() {
  const res = await fetch("https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1/saison_id/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  console.log("Fetched HTML length:", html.length);

  // Pattern matching for clubs in the table
  const matches = [...html.matchAll(/<a\s+href="(\/[^"]*\/startseite\/verein\/(\d+)\/saison_id\/2026)"[^>]*>([^<]+)<\/a>/g)];
  const clubs = new Map<string, { name: string; url: string; slug: string }>();

  for (const m of matches) {
    const url = m[1];
    const id = m[2];
    const name = m[3].trim();
    // extract slug from /slug/startseite/...
    const slugMatch = url.match(/^\/([^/]+)\/startseite/);
    const slug = slugMatch ? slugMatch[1] : "";
    if (name && slug && !clubs.has(id)) {
      clubs.set(id, { name, url, slug });
    }
  }

  console.log(`Clubs found: ${clubs.size}`);
  const list = Array.from(clubs.entries()).map(([id, c]) => ({
    tmId: id,
    name: c.name,
    slug: c.slug,
    url: "https://www.transfermarkt.com" + c.url,
  }));

  console.table(list);
  fs.writeFileSync("scripts/tm_epl_clubs_2026.json", JSON.stringify(list, null, 2), "utf-8");
}

fetchEpl().catch(console.error);
