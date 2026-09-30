import { fotmobFetch } from "../src/lib/fotmob/client";

const EPL_TEAMS = [
  { name: "Arsenal FC", id: "cmuiho5do001hb23froc57owj", fmId: 9825, tmId: "11" },
  { name: "Aston Villa", id: "cmuihq8vi008xh29edz4vg4xw", fmId: 10252, tmId: "405" },
  { name: "AFC Bournemouth", id: "cmuihqh6y00dfh29eokvzxktp", fmId: 8678, tmId: "989" },
  { name: "Brentford FC", id: "cmuihocpq001vb23fu3cm5yh8", fmId: 9937, tmId: "1148" },
  { name: "Brighton & Hove Albion", id: "cmuihomne002bb23fq0sdhdrm", fmId: 10204, tmId: "1237" },
  { name: "Chelsea FC", id: "cmuihqcpo00b1h29edf8q9ksb", fmId: 8455, tmId: "631" },
  { name: "Coventry City", id: "cmundu5xu0001zjoe1l91im6d", fmId: 8669, tmId: "990" },
  { name: "Crystal Palace", id: "cmuihqfqr00cqh29e2077zt3y", fmId: 9826, tmId: "873" },
  { name: "Everton FC", id: "cmuihq4bo006fh29ef9sfod5p", fmId: 8668, tmId: "29" },
  { name: "Fulham FC", id: "cmuihqg9600cxh29echnkyx9e", fmId: 9879, tmId: "931" },
  { name: "Hull City", id: "cmuihq56p006vh29efww9bqgh", fmId: 8667, tmId: "3008" },
  { name: "Ipswich Town", id: "cmuihqdak00bdh29e51a0c9yd", fmId: 9902, tmId: "677" },
  { name: "Leeds United", id: "cmuihq8hv008ph29ejwdrv7xd", fmId: 8463, tmId: "399" },
  { name: "Liverpool FC", id: "cmuihq5k0006zh29erp4cykkk", fmId: 8650, tmId: "31" },
  { name: "Manchester City", id: "cmuihq3vs0069h29ebm5xqhye", fmId: 8456, tmId: "281" },
  { name: "Manchester United", id: "cmuihqgxr00ddh29e8cr2u808", fmId: 10260, tmId: "985" },
  { name: "Newcastle United", id: "cmuihqepp00c5h29e6dizfj3r", fmId: 10261, tmId: "762" },
  { name: "Nottingham Forest", id: "cmuihqdq000bkh29et7iwzrfd", fmId: 10203, tmId: "703" },
  { name: "Sunderland AFC", id: "cmuihq47i006bh29e3kejf8oh", fmId: 8472, tmId: "289" },
  { name: "Tottenham Hotspur", id: "cmuihpzs8003vh29eyrxt8nk5", fmId: 8586, tmId: "148" },
];

async function main() {
  console.log("Testing FotMob squad fetching for 20 EPL clubs...");
  for (const t of EPL_TEAMS) {
    try {
      const data = await fotmobFetch<any>(`/api/data/teams?id=${t.fmId}`, 0);
      const squadGroups = data?.squad?.squad || [];
      const players = squadGroups
        .filter((g: any) => g.title !== "coach")
        .flatMap((g: any) => g.members || []);
      console.log(`- ${t.name} (fmId: ${t.fmId}): ${players.length} players found in squad.`);
    } catch (err: any) {
      console.error(`❌ Failed to fetch ${t.name}:`, err.message);
    }
  }
}

main();
