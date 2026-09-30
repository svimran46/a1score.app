import fs from "fs";

export interface TmPlayer {
  number: string;
  name: string;
  tmId: string;
  pos: string;
  dob: string;
  age: string;
  mv: string;
}

export function parseTmSquad(html: string): TmPlayer[] {
  const rows = html.split(/<tr class="(?:odd|even)">/);
  const squad: TmPlayer[] = [];

  for (let i = 1; i < rows.length; i++) {
    const chunk = rows[i].split("</tr>")[0];

    // Shirt number
    const numMatch = chunk.match(/<div class="rn_nummer">(\d+)<\/div>/);
    const number = numMatch ? numMatch[1] : "";

    // Player link and name
    const links = [...chunk.matchAll(/<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
    let tmId = "";
    let name = "";
    for (const l of links) {
      const rawName = l[2].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
      if (
        rawName &&
        !rawName.toLowerCase().includes("injury") &&
        !rawName.toLowerCase().includes("return") &&
        !rawName.toLowerCase().includes("captain") &&
        !rawName.toLowerCase().includes("suspension")
      ) {
        tmId = l[1];
        name = rawName;
      }
    }

    // Position
    const posMatch = chunk.match(
      /<td>(Goalkeeper|Centre-Back|Left-Back|Right-Back|Defensive Midfield|Central Midfield|Attacking Midfield|Right Winger|Left Winger|Second Striker|Centre-Forward)<\/td>/i
    );
    const pos = posMatch ? posMatch[1] : "";

    // DoB & Age
    const dobAgeMatch = chunk.match(/<td class="zentriert">\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s*\((\d+)\)\s*<\/td>/);
    const dob = dobAgeMatch ? dobAgeMatch[1] : "";
    const age = dobAgeMatch ? dobAgeMatch[2] : "";

    // Market Value
    const mvMatch = chunk.match(/<td class="rechts hauptlink"[^>]*>([\s\S]*?)<\/td>/);
    let mv = "";
    if (mvMatch) {
      mv = mvMatch[1].replace(/<[^>]*>/g, "").trim();
    }

    if (name && tmId) {
      squad.push({ number, name, tmId, pos, dob, age, mv });
    }
  }

  return squad;
}

async function test() {
  const res = await fetch("https://www.transfermarkt.com/liverpool-fc/startseite/verein/31/saison_id/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const squad = parseTmSquad(html);
  console.log(`Parsed ${squad.length} players for Liverpool:`);
  squad.forEach((p, idx) => {
    console.log(`${String(idx + 1).padStart(2, " ")}. #${p.number.padStart(2, " ")} | ${p.name.padEnd(25, " ")} | ${p.pos.padEnd(18, " ")} | DoB: ${p.dob.padEnd(12, " ")} | Age: ${p.age} | TM: ${p.tmId.padEnd(8, " ")} | MV: ${p.mv}`);
  });
}

test();
