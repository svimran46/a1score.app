import fs from "fs";

async function fetchLeague(comp: string, name: string) {
  const url = `https://www.transfermarkt.com/${name}/startseite/wettbewerb/${comp}/saison_id/2026`;
  console.log(`Fetching ${name} (${comp}) from ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    console.error(`Failed: ${res.status}`);
    return;
  }
  const html = await res.text();
  const tableMatch = html.match(/<table class="items">([\s\S]*?)<\/table>/);
  if (!tableMatch) {
    console.log("No table.items found");
    return;
  }
  const rows = tableMatch[1].split(/<tr class="(?:odd|even)">/);
  console.log(`Found ${rows.length - 1} clubs in ${name}:`);
  const clubs: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i].split("</tr>")[0];
    const m = r.match(/<td class="hauptlink no-border-links">\s*<a[^>]*href="([^"]*\/verein\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i);
    if (m) {
      clubs.push({ tmId: m[2], name: m[3].trim(), path: m[1] });
    }
  }
  console.table(clubs);
}

fetchLeague("ES1", "laliga").catch(console.error);
