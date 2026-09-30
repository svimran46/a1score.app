export interface TmPlayerDetails {
  number: string;
  name: string;
  tmId: string;
  pos: string;
  dob: string; // ISO string or YYYY-MM-DD
  age: number;
  nationality: string[];
  mvRaw: string;
  marketValueBigInt: bigint | null;
  photoUrl: string | null;
}

export function parseMarketValue(mvStr: string): bigint | null {
  if (!mvStr || mvStr === "-") return null;
  const clean = mvStr.replace("€", "").trim();
  if (clean.endsWith("m")) {
    const num = parseFloat(clean.replace("m", ""));
    return BigInt(Math.round(num * 1_000_000));
  } else if (clean.endsWith("k")) {
    const num = parseFloat(clean.replace("k", ""));
    return BigInt(Math.round(num * 1_000));
  }
  return null;
}

export function parseTmSquadDetailed(html: string): TmPlayerDetails[] {
  const rows = html.split(/<tr class="(?:odd|even)">/);
  const squad: TmPlayerDetails[] = [];

  for (let i = 1; i < rows.length; i++) {
    const chunk = rows[i];

    // Shirt number
    const numMatch = chunk.match(/<div class=rn_nummer>(\d+)<\/div>/);
    const number = numMatch ? numMatch[1] : "";

    // Photo URL
    const photoMatch = chunk.match(/data-src="([^"]*img\.a\.transfermarkt\.technology\/portrait\/[^"]*)"/);
    const photoUrl = photoMatch ? photoMatch[1].replace(/\?lm=\d+/, "") : null;

    // TM ID and Name
    const linkMatch = chunk.match(/<td class="hauptlink">\s*<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    if (!linkMatch) continue;
    const tmId = linkMatch[1];
    const rawName = linkMatch[2].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

    // Position
    const posMatch = chunk.match(/<tr>\s*<td>\s*(Goalkeeper|Centre-Back|Left-Back|Right-Back|Defensive Midfield|Central Midfield|Attacking Midfield|Right Winger|Left Winger|Second Striker|Centre-Forward)\s*<\/td>\s*<\/tr>/i);
    const pos = posMatch ? posMatch[1].trim() : "Unknown";

    // DoB & Age
    const dobMatch = chunk.match(/<td class="zentriert">\s*(\d{2})\/(\d{2})\/(\d{4})\s*\((\d+)\)\s*<\/td>/);
    let dob = "";
    let age = 0;
    if (dobMatch) {
      const day = dobMatch[1];
      const month = dobMatch[2];
      const year = dobMatch[3];
      dob = `${year}-${month}-${day}T00:00:00.000Z`;
      age = parseInt(dobMatch[4], 10);
    }

    // Nationality
    const natMatches = [
      ...chunk.matchAll(/<img[^>]*title="([^"]+)"[^>]*class="[^"]*flaggenrahmen[^"]*"/g),
      ...chunk.matchAll(/<img[^>]*class="[^"]*flaggenrahmen[^"]*"[^>]*title="([^"]+)"/g),
    ];
    const nationality = Array.from(new Set(natMatches.map((m) => m[1])));

    // Market Value
    const mvMatch = chunk.match(/<td class="rechts hauptlink"><a [^>]*>([^<]+)<\/a><\/td>/);
    const mvRaw = mvMatch ? mvMatch[1].trim() : "";
    const marketValueBigInt = parseMarketValue(mvRaw);

    squad.push({
      number,
      name: rawName,
      tmId,
      pos,
      dob,
      age,
      nationality,
      mvRaw,
      marketValueBigInt,
      photoUrl,
    });
  }

  return squad;
}

async function test() {
  const res = await fetch("https://www.transfermarkt.com/fc-liverpool/startseite/verein/31/saison_id/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const squad = parseTmSquadDetailed(html);
  console.log(`Parsed ${squad.length} players for Liverpool:`);
  console.log(squad[0]);
  console.log(squad[squad.length - 1]);
}

test();
