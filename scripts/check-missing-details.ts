import fs from "fs";

interface TmPlayer {
  number: string;
  name: string;
  tmId: string;
  pos: string;
  dob: string;
  age: string;
  mv: string;
}

// Let's re-parse or inspect the html for these clubs
const clubs = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
const missingList = [
  { clubTmId: "985", name: "Senne Lammens", tmId: "503883" },
  { clubTmId: "762", name: "Ewen Jaouen", tmId: "923757" },
  { clubTmId: "1237", name: "Jaouen Hadjam", tmId: "750903" },
  { clubTmId: "1237", name: "Costinha", tmId: "539252" },
  { clubTmId: "1237", name: "Zadok Yohanna", tmId: "1421433" },
  { clubTmId: "1237", name: "Femi Azeez", tmId: "703408" },
  { clubTmId: "1237", name: "Promise David", tmId: "888785" },
  { clubTmId: "1148", name: "Jannik Schuster", tmId: "915418" },
  { clubTmId: "1148", name: "Benjamin Fredrick", tmId: "1071138" },
  { clubTmId: "1148", name: "Kaye Furo", tmId: "1011936" },
  { clubTmId: "873", name: "Anan Khalaili", tmId: "945021" },
  { clubTmId: "873", name: "Darío Osorio", tmId: "881116" },
  { clubTmId: "873", name: "Zavier Gozo", tmId: "1007383" },
  { clubTmId: "989", name: "Max Aarons", tmId: "471690" },
  { clubTmId: "989", name: "Daniel Jebbison", tmId: "746740" },
  { clubTmId: "405", name: "Modou Kéba Cissé", tmId: "1282860" },
  { clubTmId: "405", name: "Tammy Abraham", tmId: "331726" },
  { clubTmId: "289", name: "Jules Ahoka", tmId: "1401779" },
  { clubTmId: "289", name: "Alan Browne", tmId: "277697" },
  { clubTmId: "289", name: "Nilson Angulo", tmId: "903611" },
  { clubTmId: "931", name: "Alex Borto", tmId: "817613" },
  { clubTmId: "931", name: "Kevin", tmId: "900195" },
  { clubTmId: "29", name: "Hayden Hackney", tmId: "538216" },
];

async function checkDetails() {
  console.log("Checking details for missing players from TM...");
  // Group by club
  const byClub = new Map<string, typeof missingList>();
  for (const m of missingList) {
    if (!byClub.has(m.clubTmId)) byClub.set(m.clubTmId, []);
    byClub.get(m.clubTmId)!.push(m);
  }

  for (const [clubTmId, players] of byClub.entries()) {
    const club = clubs.find((c: any) => c.tmId === clubTmId);
    console.log(`\n=== ${club.tmName} (TM ${clubTmId}) ===`);
    const res = await fetch(club.squadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    for (const p of players) {
      // Find row with tmId
      const regex = new RegExp(`href="[^"]*\\/profil\\/spieler\\/${p.tmId}"[\\s\\S]*?<\\/tr>`, "i");
      const match = html.match(regex);
      if (match) {
        console.log(`\nFound row for ${p.name} (TM ${p.tmId}):`);
        console.log(match[0].slice(0, 400));
      } else {
        console.log(`Could not find row for ${p.name} (TM ${p.tmId})`);
      }
    }
  }
}

checkDetails().catch(console.error);
