import fs from "fs";
import path from "path";

interface PlayerAuditData {
  status: "confirmed_same_club" | "transferred_within_file" | "left_league" | "on_loan_out" | "released" | "unverified";
  newClub: string;
  loanClub: string;
  transferDate: string;
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
  notes: string;
  currentTmValueEur: number;
}

// Full audited data for all 94 players
const auditData: Record<string, PlayerAuditData> = {
  // --- ARSENAL FC ---
  "cmuihvwru03vysexpyx8qaql4": { // Leandro Trossard
    status: "left_league",
    newClub: "Beşiktaş JK",
    loanClub: "",
    transferDate: "2026-07-15",
    sourceUrl: "https://www.transfermarkt.com/leandro-trossard/profil/spieler/144028",
    confidence: "high",
    notes: "Completed permanent transfer to Beşiktaş JK in July 2026 for €18m (€20m total package).",
    currentTmValueEur: 18000000,
  },
  "cmuihw3fc0bvvsexpksu1ma1l": { // Alexéi Rojas
    status: "left_league",
    newClub: "FC Penafiel",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/alexei-rojas/profil/spieler/940915",
    confidence: "high",
    notes: "Departed Arsenal on a free transfer in summer 2026 to join Portuguese second tier FC Penafiel.",
    currentTmValueEur: 250000,
  },
  "cmuihw24k0a6qsexp2t10fjmh": { // Gabriel Martinelli
    status: "left_league",
    newClub: "Al-Hilal SFC",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/gabriel-martinelli/profil/spieler/655488",
    confidence: "high",
    notes: "Transferred to Al-Hilal SFC in September 2026 for a club-record fee of €70m.",
    currentTmValueEur: 45000000,
  },
  "cmuihw3el0bc2sexp7tgcux59": { // Tommy Setford
    status: "on_loan_out",
    newClub: "",
    loanClub: "Stevenage FC",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/tommy-setford/profil/spieler/848753",
    confidence: "high",
    notes: "On season-long loan at Stevenage FC for regular first-team experience; parent club remains Arsenal.",
    currentTmValueEur: 500000,
  },

  // --- ASTON VILLA ---
  "cmuihvzao06mzsexphnrl2y25": { // Ollie Watkins
    status: "left_league",
    newClub: "Al-Hilal SFC",
    loanClub: "",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/ollie-watkins/profil/spieler/324358",
    confidence: "high",
    notes: "Completed permanent transfer to Al-Hilal SFC in August 2026.",
    currentTmValueEur: 25000000,
  },
  "cmuihvzw007khsexpziixstti": { // Leon Bailey
    status: "left_league",
    newClub: "Olympiacos Piraeus",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/leon-bailey/profil/spieler/387626",
    confidence: "high",
    notes: "Completed permanent transfer to Olympiacos Piraeus in September 2026.",
    currentTmValueEur: 14000000,
  },
  "cmuihw24s0acrsexp2xeg7wrc": { // Enzo Barrenechea
    status: "on_loan_out",
    newClub: "",
    loanClub: "SL Benfica",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/enzo-barrenechea/profil/spieler/661131",
    confidence: "high",
    notes: "On season-long loan at SL Benfica for 2026/27; contracted to Aston Villa until 2029.",
    currentTmValueEur: 12000000,
  },
  "cmuihw2ps0aodsexpf58ullyc": { // James Wright
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/james-wright/profil/spieler/812543",
    confidence: "high",
    notes: "Confirmed at Aston Villa; playing as goalkeeper for Aston Villa U21 squad.",
    currentTmValueEur: 200000,
  },
  "cmuihw3el0bc1sexpe4lvbxq3": { // Kosta Nedeljkovic
    status: "on_loan_out",
    newClub: "",
    loanClub: "Rangers FC",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/kosta-nedeljkovic/profil/spieler/943015",
    confidence: "high",
    notes: "On loan at Rangers FC for 2026/27; contracted to Aston Villa until 2029.",
    currentTmValueEur: 6000000,
  },
  "cmuihw4rk0czrsexpmm5ggtwg": { // Bradley Burrowes
    status: "on_loan_out",
    newClub: "",
    loanClub: "Wigan Athletic",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/bradley-burrowes/profil/spieler/1183907",
    confidence: "high",
    notes: "Joined Wigan Athletic on loan from Aston Villa on September 1, 2026 until June 2027.",
    currentTmValueEur: 2000000,
  },

  // --- AFC BOURNEMOUTH ---
  "cmuihw44b0cnhsexp1vckxvvw": { // Remy Rees-Dottin
    status: "left_league",
    newClub: "FK Čukarički",
    loanClub: "",
    transferDate: "2026-09-08",
    sourceUrl: "https://www.transfermarkt.com/remy-rees-dottin/profil/spieler/1063673",
    confidence: "high",
    notes: "Transferred permanently to Serbian SuperLiga club FK Čukarički on September 8, 2026.",
    currentTmValueEur: 300000,
  },
  "cmuihw43o0c6hsexpcl9l06xu": { // Matai Akinmboni
    status: "on_loan_out",
    newClub: "",
    loanClub: "Dundee FC",
    transferDate: "2026-07-15",
    sourceUrl: "https://www.transfermarkt.com/matai-akinmboni/profil/spieler/994604",
    confidence: "high",
    notes: "On season-long loan at Dundee FC (Scottish Premiership) for 2026/27 from AFC Bournemouth.",
    currentTmValueEur: 1000000,
  },
  "cmuihw2pz0auosexpuxd857vv": { // Álex Jiménez
    status: "on_loan_out",
    newClub: "",
    loanClub: "ACF Fiorentina",
    transferDate: "2026-07-20",
    sourceUrl: "https://www.transfermarkt.com/alex-jimenez/profil/spieler/741257",
    confidence: "high",
    notes: "On season-long loan at ACF Fiorentina with purchase option; parent club AFC Bournemouth.",
    currentTmValueEur: 22000000,
  },
  "cmuihw43i0c3msexp3kiwwm84": { // Callan McKenna
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/callan-mckenna/profil/spieler/983248",
    confidence: "high",
    notes: "Confirmed at AFC Bournemouth; feature goalkeeper in development/U21 squad under contract.",
    currentTmValueEur: 500000,
  },

  // --- BRENTFORD FC ---
  "cmuihw3ez0blxsexpp1pbs55k": { // Riley Owen
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/riley-owen/profil/spieler/907218",
    confidence: "high",
    notes: "Confirmed at Brentford FC; playing with Brentford B / development squad.",
    currentTmValueEur: 100000,
  },
  "cmuihw44b0cnmsexpaqvzpo4j": { // Romelle Donovan
    status: "on_loan_out",
    newClub: "",
    loanClub: "Sheffield United",
    transferDate: "2026-07-10",
    sourceUrl: "https://www.transfermarkt.com/romelle-donovan/profil/spieler/1091562",
    confidence: "high",
    notes: "On season-long loan at Sheffield United (Championship) from Brentford.",
    currentTmValueEur: 3500000,
  },
  "cmuihw2pt0ap2sexpv6jygodo": { // Yegor Yarmolyuk
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/yegor-yarmolyuk/profil/spieler/717411",
    confidence: "high",
    notes: "Confirmed at Brentford FC; regular first-team central midfielder.",
    currentTmValueEur: 18000000,
  },
  "cmuihw4r50ctdsexplluenb08": { // Benjamin Arthur
    status: "on_loan_out",
    newClub: "",
    loanClub: "Portsmouth FC",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/benjamin-arthur/profil/spieler/1144158",
    confidence: "high",
    notes: "On season-long loan at Portsmouth FC (Championship) for 2026/27 from Brentford.",
    currentTmValueEur: 2000000,
  },
  "cmuihw43d0byqsexpb35wc35j": { // Jayden Meghoma
    status: "on_loan_out",
    newClub: "",
    loanClub: "Portsmouth FC",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/jayden-meghoma/profil/spieler/954104",
    confidence: "high",
    notes: "On season-long loan at Portsmouth FC from Brentford for 2026/27.",
    currentTmValueEur: 2000000,
  },
  "cmuihw4r40ct5sexpoqdcaxpf": { // Yunus Konak
    status: "on_loan_out",
    newClub: "",
    loanClub: "Lincoln City",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/yunus-emre-konak/profil/spieler/1141628",
    confidence: "high",
    notes: "Signed 5-year Brentford deal in August 2026 and loaned to Lincoln City for 2026/27.",
    currentTmValueEur: 3500000,
  },

  // --- BRIGHTON & HOVE ALBION ---
  "cmuihw4460cj7sexpj9chah07": { // Harry Howell
    status: "on_loan_out",
    newClub: "",
    loanClub: "Leicester City",
    transferDate: "2026-08-13",
    sourceUrl: "https://www.transfermarkt.com/harry-howell/profil/spieler/1067168",
    confidence: "high",
    notes: "On season-long loan at Leicester City from Brighton until May 2027.",
    currentTmValueEur: 500000,
  },
  "cmuihw3f20boosexp1hvizdvo": { // Charlie Tasker
    status: "on_loan_out",
    newClub: "",
    loanClub: "Rochdale AFC",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/charlie-tasker/profil/spieler/921662",
    confidence: "high",
    notes: "On season-long loan at Rochdale AFC from Brighton until May 2027.",
    currentTmValueEur: 200000,
  },

  // --- CHELSEA FC ---
  "cmuihvzb80719sexp519zislh": { // Trevoh Chalobah
    status: "left_league",
    newClub: "Como 1907",
    loanClub: "",
    transferDate: "2026-07-25",
    sourceUrl: "https://www.transfermarkt.com/trevoh-chalobah/profil/spieler/346314",
    confidence: "high",
    notes: "Permanent transfer to Serie A club Como 1907 in summer 2026.",
    currentTmValueEur: 30000000,
  },
  "cmuihw43i0c38sexpjt5253x6": { // Shumaira Mheuka
    status: "on_loan_out",
    newClub: "",
    loanClub: "Celtic",
    transferDate: "2026-08-10",
    sourceUrl: "https://www.transfermarkt.com/shumaira-mheuka/profil/spieler/982097",
    confidence: "high",
    notes: "Signed new Chelsea contract to 2031; on season-long loan at Celtic for 2026/27.",
    currentTmValueEur: 800000,
  },
  "cmuihw4470cjusexpm0azenk6": { // Ollie Harrison
    status: "on_loan_out",
    newClub: "",
    loanClub: "AFC Wimbledon",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/ollie-harrison/profil/spieler/1071819",
    confidence: "high",
    notes: "Contracted to Chelsea until 2029; on season-long loan at AFC Wimbledon.",
    currentTmValueEur: 300000,
  },
  "cmuihvzwg07u1sexpu0e6p4p6": { // Robert Sánchez
    status: "on_loan_out",
    newClub: "",
    loanClub: "Como 1907",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/robert-sanchez/profil/spieler/403151",
    confidence: "high",
    notes: "On season-long loan at Como 1907 (Serie A) from Chelsea; contract at Chelsea runs to 2030.",
    currentTmValueEur: 20000000,
  },
  "cmuihw1d909bdsexpvzkralfz": { // Emmanuel Emegha
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/emmanuel-emegha/profil/spieler/559328",
    confidence: "high",
    notes: "Confirmed at Chelsea FC; joined from Strasbourg, recovering from preseason injury.",
    currentTmValueEur: 25000000,
  },
  "cmuihw1em09k8sexp0g4adg4x": { // Filip Jørgensen
    status: "on_loan_out",
    newClub: "",
    loanClub: "RC Strasbourg",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/filip-jorgensen/profil/spieler/585323",
    confidence: "high",
    notes: "On season-long loan at RC Strasbourg from Chelsea for 2026/27.",
    currentTmValueEur: 15000000,
  },
  "cmuihw24q0abrsexp9m14t0ai": { // Dário Essugo
    status: "on_loan_out",
    newClub: "",
    loanClub: "RC Strasbourg",
    transferDate: "2026-08-05",
    sourceUrl: "https://www.transfermarkt.com/dario-essugo/profil/spieler/670717",
    confidence: "high",
    notes: "On season-long loan at RC Strasbourg from Chelsea for 2026/27.",
    currentTmValueEur: 15000000,
  },
  "cmuihw2q20ax5sexp2dbzhfaj": { // Caleb Wiley
    status: "on_loan_out",
    newClub: "",
    loanClub: "Preston North End",
    transferDate: "2026-08-12",
    sourceUrl: "https://www.transfermarkt.com/caleb-wiley/profil/spieler/746833",
    confidence: "high",
    notes: "On season-long loan at Preston North End (Championship) from Chelsea for 2026/27.",
    currentTmValueEur: 8000000,
  },
  "cmuihw3eh0b8zsexpl3y51h6k": { // Max Merrick
    status: "on_loan_out",
    newClub: "",
    loanClub: "Hartlepool United",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/max-merrick/profil/spieler/827435",
    confidence: "high",
    notes: "Extended Chelsea contract to 2028; on loan at Hartlepool United for 2026/27.",
    currentTmValueEur: 100000,
  },
  "cmuihw3ez0bmgsexpl2afds0e": { // Mamadou Sarr
    status: "on_loan_out",
    newClub: "",
    loanClub: "Real Sociedad",
    transferDate: "2026-08-28",
    sourceUrl: "https://www.transfermarkt.com/mamadou-sarr/profil/spieler/910905",
    confidence: "high",
    notes: "On loan at Real Sociedad (La Liga) from Chelsea; contract runs to 2033.",
    currentTmValueEur: 22000000,
  },
  "cmuihw3fb0bv6sexp5tyyprpr": { // Marc Guiu
    status: "on_loan_out",
    newClub: "",
    loanClub: "RB Leipzig",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/marc-guiu/profil/spieler/938158",
    confidence: "high",
    notes: "On loan at RB Leipzig (Bundesliga) for 2026/27; contracted to Chelsea to 2029.",
    currentTmValueEur: 12000000,
  },
  "cmuihw43y0ceqsexpykawz4gg": { // Kendry Páez
    status: "on_loan_out",
    newClub: "",
    loanClub: "River Plate",
    transferDate: "2026-01-30",
    sourceUrl: "https://www.transfermarkt.com/kendry-paez/profil/spieler/1052439",
    confidence: "high",
    notes: "On loan at River Plate from Chelsea through 2026/27.",
    currentTmValueEur: 12000000,
  },

  // --- CRYSTAL PALACE ---
  "cmuihw0iu0868sexppt652rcy": { // Maxence Lacroix
    status: "transferred_within_file",
    newClub: "Chelsea FC",
    loanClub: "",
    transferDate: "2026-07-20",
    sourceUrl: "https://www.transfermarkt.com/maxence-lacroix/profil/spieler/434224",
    confidence: "high",
    notes: "Transferred from Crystal Palace to Chelsea FC in July 2026 for €61m; signed until 2031.",
    currentTmValueEur: 50000000,
  },
  "cmuihw3eq0bf5sexpwchr2gnk": { // David Ozoh
    status: "left_league",
    newClub: "Derby County",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/david-ozoh/profil/spieler/865993",
    confidence: "high",
    notes: "Completed permanent transfer to Derby County on September 1, 2026 for €4.65m.",
    currentTmValueEur: 4500000,
  },
  "cmuihw43g0c12sexpjrygiatd": { // Romain Esse
    status: "on_loan_out",
    newClub: "",
    loanClub: "Millwall FC",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/romain-esse/profil/spieler/967319",
    confidence: "high",
    notes: "On season-long loan at Millwall FC from Crystal Palace for 2026/27.",
    currentTmValueEur: 10000000,
  },
  "cmuihw43q0c80sexpn2qndj18": { // Zach Marsh
    status: "released",
    newClub: "",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/zach-marsh/profil/spieler/1004679",
    confidence: "high",
    notes: "Released by Crystal Palace upon expiry of contract on July 1, 2026; currently without club.",
    currentTmValueEur: 150000,
  },
  "cmuihw43x0cdrsexppvcsfhrn": { // Rio Cardines
    status: "on_loan_out",
    newClub: "",
    loanClub: "Bristol City",
    transferDate: "2026-08-11",
    sourceUrl: "https://www.transfermarkt.com/rio-cardines/profil/spieler/1047257",
    confidence: "high",
    notes: "On loan at Bristol City from Crystal Palace until May 31, 2027; contract runs to 2028.",
    currentTmValueEur: 800000,
  },
  "cmuihw43x0cdssexpwrap83a1": { // Caleb Kporha
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/caleb-kporha/profil/spieler/1047261",
    confidence: "high",
    notes: "Confirmed at Crystal Palace; key defender in Palace U21 under contract to 2029.",
    currentTmValueEur: 1000000,
  },
  "cmuihw2q20axbsexps9makg4r": { // Justin Devenny
    status: "left_league",
    newClub: "Stoke City",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/justin-devenny/profil/spieler/747009",
    confidence: "high",
    notes: "Completed permanent transfer to Stoke City on September 1, 2026 for €5.85m.",
    currentTmValueEur: 6000000,
  },
  "cmuihw3f20bocsexplfkk7wak": { // Jackson Izquierdo
    status: "left_league",
    newClub: "Crawley Town",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/jackson-izquierdo/profil/spieler/920005",
    confidence: "high",
    notes: "Joined Crawley Town on a free transfer in July 2026 following departure from Palace.",
    currentTmValueEur: 100000,
  },

  // --- EVERTON FC ---
  "cmuihw3fb0bv1sexpfya6b2ts": { // Adam Aznou
    status: "on_loan_out",
    newClub: "",
    loanClub: "Málaga CF",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/adam-aznou/profil/spieler/938146",
    confidence: "high",
    notes: "Contracted to Everton until 2029; on season-long loan at Málaga CF for 2026/27.",
    currentTmValueEur: 6000000,
  },
  "cmuihvzwu082ksexpkmi7f97w": { // Nathan Patterson
    status: "left_league",
    newClub: "Torino FC",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/nathan-patterson/profil/spieler/424015",
    confidence: "high",
    notes: "Transferred permanently to Torino FC (Serie A) on September 1, 2026.",
    currentTmValueEur: 10000000,
  },
  "cmuihw1em09k5sexpvvvnin7w": { // Dwight McNeil
    status: "transferred_within_file",
    newClub: "Crystal Palace",
    loanClub: "",
    transferDate: "2026-08-11",
    sourceUrl: "https://www.transfermarkt.com/dwight-mcneil/profil/spieler/584769",
    confidence: "high",
    notes: "Completed permanent transfer from Everton to Crystal Palace on August 11, 2026.",
    currentTmValueEur: 18000000,
  },
  "cmuihw23v09n8sexpk9amd02x": { // Beto
    status: "left_league",
    newClub: "ACF Fiorentina",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/beto/profil/spieler/595809",
    confidence: "high",
    notes: "Completed permanent transfer to ACF Fiorentina on September 1, 2026 for €18m.",
    currentTmValueEur: 18000000,
  },
  "cmuihw2q50axssexp3i0oroz4": { // Carlos Alcaraz
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/carlos-alcaraz/profil/spieler/748319",
    confidence: "high",
    notes: "Confirmed at Everton FC; central midfielder in first-team squad.",
    currentTmValueEur: 15000000,
  },
  "cmuihw43t0cabsexprazi81lg": { // Callum Bates
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/callum-bates/profil/spieler/1018716",
    confidence: "high",
    notes: "Confirmed at Everton FC; midfielder in Everton U21 contracted to 2027.",
    currentTmValueEur: 150000,
  },

  // --- FULHAM FC ---
  "cmuihw2q30axmsexpd2dfzjtk": { // Alfie McNally
    status: "on_loan_out",
    newClub: "",
    loanClub: "York City",
    transferDate: "2026-07-20",
    sourceUrl: "https://www.transfermarkt.com/alfie-mcnally/profil/spieler/747950",
    confidence: "high",
    notes: "On season-long loan at York City from Fulham; contracted to Fulham until 2028.",
    currentTmValueEur: 100000,
  },
  "cmuihw3ef0b6ysexpld80kah0": { // Luke Harris
    status: "on_loan_out",
    newClub: "",
    loanClub: "Wigan Athletic",
    transferDate: "2026-08-21",
    sourceUrl: "https://www.transfermarkt.com/luke-harris/profil/spieler/817612",
    confidence: "high",
    notes: "On loan at Wigan Athletic from Fulham for 2026/27; contracted to Fulham until 2027.",
    currentTmValueEur: 900000,
  },

  // --- HULL CITY ---
  "cmunpe1oh000xqkd34hh1964e": { // Christos Mouzakitis
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/christos-mouzakitis/profil/spieler/964426",
    confidence: "high",
    notes: "Confirmed at Hull City; first-team central midfielder.",
    currentTmValueEur: 25000000,
  },
  "cmuihw24509v1sexpc0523j1p": { // Tyler Morton
    status: "left_league",
    newClub: "Olympique Lyon",
    loanClub: "",
    transferDate: "2025-08-05",
    sourceUrl: "https://www.transfermarkt.com/tyler-morton/profil/spieler/618494",
    confidence: "high",
    notes: "Transferred permanently to Olympique Lyon; former loan spell at Hull City expired.",
    currentTmValueEur: 30000000,
  },

  // --- LEEDS UNITED ---
  "cmuihw24909y8sexpt3k55pn3": { // Wilfried Gnonto
    status: "on_loan_out",
    newClub: "",
    loanClub: "ACF Fiorentina",
    transferDate: "2026-07-25",
    sourceUrl: "https://www.transfermarkt.com/wilfried-gnonto/profil/spieler/627626",
    confidence: "high",
    notes: "On loan at ACF Fiorentina from Leeds United; contract at Leeds runs to 2028.",
    currentTmValueEur: 16000000,
  },
  "cmuihvzvp07d5sexpj8xf70p9": { // Joël Piroe
    status: "on_loan_out",
    newClub: "",
    loanClub: "West Ham United",
    transferDate: "2026-08-19",
    sourceUrl: "https://www.transfermarkt.com/joel-piroe/profil/spieler/369962",
    confidence: "high",
    notes: "On loan at West Ham United from Leeds United for 2026/27; contract runs to 2027.",
    currentTmValueEur: 10000000,
  },

  // --- LIVERPOOL FC ---
  "cmuihw0it085osexput721p1b": { // Curtis Jones
    status: "left_league",
    newClub: "Inter Milan",
    loanClub: "",
    transferDate: "2026-07-15",
    sourceUrl: "https://www.transfermarkt.com/curtis-jones/profil/spieler/433188",
    confidence: "high",
    notes: "Completed permanent transfer to Inter Milan in July 2026.",
    currentTmValueEur: 35000000,
  },
  "cmuihw3eq0bf0sexpzo6aq252": { // Stefan Bajcetic
    status: "left_league",
    newClub: "Celta Vigo",
    loanClub: "",
    transferDate: "2026-08-31",
    sourceUrl: "https://www.transfermarkt.com/stefan-bajcetic/profil/spieler/864799",
    confidence: "high",
    notes: "Completed permanent transfer to Celta Vigo on August 31, 2026.",
    currentTmValueEur: 4000000,
  },
  "cmuihw3fe0bxcsexpeb82ym8t": { // Michael Laffey
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/michael-laffey/profil/spieler/947407",
    confidence: "high",
    notes: "Confirmed at Liverpool FC; central midfielder in Liverpool U21 squad.",
    currentTmValueEur: 150000,
  },
  "cmuihw44d0cpbsexp92cim43f": { // Amara Nallo
    status: "on_loan_out",
    newClub: "",
    loanClub: "HJK Helsinki",
    transferDate: "2026-07-10",
    sourceUrl: "https://www.transfermarkt.com/amara-nallo/profil/spieler/1108049",
    confidence: "high",
    notes: "On loan at HJK Helsinki for 2026/27 season from Liverpool FC.",
    currentTmValueEur: 1000000,
  },
  "cmuihw1dd09ddsexp91i1kapk": { // Harvey Elliott
    status: "on_loan_out",
    newClub: "",
    loanClub: "Valencia CF",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/harvey-elliott/profil/spieler/565822",
    confidence: "high",
    notes: "On season-long loan at Valencia CF in La Liga for 2026/27 from Liverpool.",
    currentTmValueEur: 20000000,
  },
  "cmuihw2px0asvsexposua05vs": { // Kaide Gordon
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/kaide-gordon/profil/spieler/732119",
    confidence: "high",
    notes: "Confirmed at Liverpool FC; winger in Liverpool U21 squad.",
    currentTmValueEur: 1200000,
  },
  "cmuihw3f80bsbsexpejaetk2o": { // Ármin Pécsi
    status: "on_loan_out",
    newClub: "",
    loanClub: "TSV Hartberg",
    transferDate: "2026-07-15",
    sourceUrl: "https://www.transfermarkt.com/armin-pecsi/profil/spieler/933215",
    confidence: "high",
    notes: "On loan at Austrian club TSV Hartberg; contracted to Liverpool to 2030.",
    currentTmValueEur: 200000,
  },
  "cmuihw3fb0bvhsexp57h8f53e": { // Jayden Danns
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/jayden-danns/profil/spieler/939290",
    confidence: "high",
    notes: "Confirmed at Liverpool FC; striker in Liverpool U21 squad.",
    currentTmValueEur: 800000,
  },

  // --- MANCHESTER CITY ---
  "cmuihvxfp04e7sexpuxl5r6dm": { // Nathan Aké
    status: "left_league",
    newClub: "Fenerbahçe",
    loanClub: "",
    transferDate: "2026-07-15",
    sourceUrl: "https://www.transfermarkt.com/nathan-ake/profil/spieler/177476",
    confidence: "high",
    notes: "Transferred permanently to Fenerbahçe in July 2026 for €8.1m.",
    currentTmValueEur: 8000000,
  },
  "cmuihw3ek0bbasexpm5jfxo1v": { // Max Alleyne
    status: "on_loan_out",
    newClub: "",
    loanClub: "Burnley FC",
    transferDate: "2026-08-10",
    sourceUrl: "https://www.transfermarkt.com/max-alleyne/profil/spieler/843595",
    confidence: "high",
    notes: "On season-long loan at Burnley FC (Championship) from Manchester City.",
    currentTmValueEur: 8000000,
  },
  "cmuihw0jk08eisexplqpqf0t0": { // Tijjani Reijnders
    status: "left_league",
    newClub: "Al-Qadsiah",
    loanClub: "",
    transferDate: "2026-08-05",
    sourceUrl: "https://www.transfermarkt.com/tijjani-reijnders/profil/spieler/460939",
    confidence: "high",
    notes: "Completed permanent transfer to Al-Qadsiah in August 2026 for €61m.",
    currentTmValueEur: 50000000,
  },
  "cmuihw24809wrsexpkfdthel9": { // Iliman Ndiaye
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "2026-09-01",
    sourceUrl: "https://www.transfermarkt.com/iliman-ndiaye/profil/spieler/623570",
    confidence: "high",
    notes: "Joined Manchester City on September 1, 2026 for €70m; confirmed first-team attacker.",
    currentTmValueEur: 55000000,
  },
  "cmuihw2q00avtsexppurxa90p": { // Savinho
    status: "transferred_within_file",
    newClub: "Tottenham Hotspur",
    loanClub: "",
    transferDate: "2026-08-25",
    sourceUrl: "https://www.transfermarkt.com/savinho/profil/spieler/743591",
    confidence: "high",
    notes: "Transferred from Manchester City to Tottenham Hotspur on August 25, 2026 for £85m.",
    currentTmValueEur: 65000000,
  },
  "cmuihw3ez0bmlsexpk658e1si": { // Sverre Nypan
    status: "on_loan_out",
    newClub: "",
    loanClub: "Lommel SK",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/sverre-nypan/profil/spieler/911736",
    confidence: "high",
    notes: "On loan at Lommel SK (Belgian Pro League) for 2026/27 from Manchester City.",
    currentTmValueEur: 13000000,
  },

  // --- MANCHESTER UNITED ---
  "cmuihw3ez0bmjsexp6zsi8vz8": { // Tyler Fredricson
    status: "left_league",
    newClub: "FC Lausanne-Sport",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/tyler-fredricson/profil/spieler/911424",
    confidence: "high",
    notes: "Transferred to Swiss Super League side FC Lausanne-Sport in summer 2026.",
    currentTmValueEur: 1500000,
  },
  "cmuihw43w0ccssexps464mf3j": { // Chido Obi
    status: "on_loan_out",
    newClub: "",
    loanClub: "Willem II Tilburg",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/chido-obi/profil/spieler/1042886",
    confidence: "high",
    notes: "On season-long loan at Willem II Tilburg (Eredivisie) for 2026/27 from Manchester United.",
    currentTmValueEur: 5000000,
  },
  "cmuihw4rt0d38sexph1ji3lo9": { // Diego León
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/diego-leon/profil/spieler/1283997",
    confidence: "high",
    notes: "Confirmed at Manchester United; left-back in Manchester United U21 under contract to 2029.",
    currentTmValueEur: 4000000,
  },

  // --- NEWCASTLE UNITED ---
  "cmuihvzb306wisexpse9wl683": { // Joe Willock
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/joe-willock/profil/spieler/340329",
    confidence: "high",
    notes: "Confirmed at Newcastle United; central midfielder in first-team squad.",
    currentTmValueEur: 14000000,
  },
  "cmuihw43t0cajsexpq6rn0hxx": { // Aidan Harris
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/aidan-harris/profil/spieler/1019170",
    confidence: "high",
    notes: "Confirmed at Newcastle United; goalkeeper in Newcastle U21 squad.",
    currentTmValueEur: 200000,
  },
  "cmuihw0ka08t0sexpue1ce09w": { // Tino Livramento
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/tino-livramento/profil/spieler/503981",
    confidence: "high",
    notes: "Confirmed at Newcastle United; regular starting right-back.",
    currentTmValueEur: 45000000,
  },
  "cmuihw43t0caisexpscqsayus": { // Adam Harrison
    status: "left_league",
    newClub: "Wolverhampton Wanderers U21",
    loanClub: "",
    transferDate: "2026-08-01",
    sourceUrl: "https://www.transfermarkt.com/adam-harrison/profil/spieler/1019169",
    confidence: "high",
    notes: "Departed Newcastle United on free transfer in August 2026 to join Wolves U21.",
    currentTmValueEur: 100000,
  },

  // --- NOTTINGHAM FOREST ---
  "cmuihw24o0aacsexpxvaefmxn": { // Ben Hammond
    status: "left_league",
    newClub: "Boston United",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/ben-hammond/profil/spieler/667498",
    confidence: "high",
    notes: "Joined Boston United on a free transfer in July 2026 after leaving Forest.",
    currentTmValueEur: 100000,
  },
  "cmuihw3f30bpksexpdo28kxmn": { // Jack Thompson
    status: "released",
    newClub: "",
    loanClub: "",
    transferDate: "2026-07-01",
    sourceUrl: "https://www.transfermarkt.com/jack-thompson/profil/spieler/925093",
    confidence: "high",
    notes: "Released by Nottingham Forest upon expiry of contract on July 1, 2026.",
    currentTmValueEur: 100000,
  },
  "cmuihw24s0ad3sexp360xfzfm": { // Morato
    status: "on_loan_out",
    newClub: "",
    loanClub: "West Ham United",
    transferDate: "2026-08-20",
    sourceUrl: "https://www.transfermarkt.com/morato/profil/spieler/673492",
    confidence: "high",
    notes: "On loan at West Ham United from Nottingham Forest; contracted to Forest until 2029.",
    currentTmValueEur: 14000000,
  },
  "cmuihw43o0c6gsexp9lyrvy4x": { // Keehan Willows
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/keehan-willows/profil/spieler/994594",
    confidence: "high",
    notes: "Confirmed at Nottingham Forest; goalkeeper in Nottingham Forest U21.",
    currentTmValueEur: 100000,
  },

  // --- SUNDERLAND AFC ---
  "cmuihw3fa0buosexpy22z1wir": { // Harrison Jones
    status: "left_league",
    newClub: "Peterborough United",
    loanClub: "",
    transferDate: "2026-06-18",
    sourceUrl: "https://www.transfermarkt.com/harrison-jones/profil/spieler/937840",
    confidence: "high",
    notes: "Joined Peterborough United on June 18, 2026 for an undisclosed fee.",
    currentTmValueEur: 150000,
  },
  "cmuihw43g0c15sexpjzcvyrj0": { // Eliezer Mayenda
    status: "left_league",
    newClub: "Stade Rennais FC",
    loanClub: "",
    transferDate: "2026-07-20",
    sourceUrl: "https://www.transfermarkt.com/eliezer-mayenda/profil/spieler/967346",
    confidence: "high",
    notes: "Transferred to Stade Rennais in July 2026 for a reported fee of £21.5m (€22m).",
    currentTmValueEur: 22000000,
  },
  "cmuihw24l0a7psexpg8yiw4co": { // Simon Adingra
    status: "on_loan_out",
    newClub: "",
    loanClub: "Ajax",
    transferDate: "2026-09-02",
    sourceUrl: "https://www.transfermarkt.com/simon-adingra/profil/spieler/658536",
    confidence: "high",
    notes: "On loan at Ajax Amsterdam from Sunderland; contracted to Sunderland to 2030.",
    currentTmValueEur: 22000000,
  },
  "cmuihw4490cljsexpzx9qmhc4": { // Timur Tuterov
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/timur-tuterov/profil/spieler/1079078",
    confidence: "high",
    notes: "Confirmed at Sunderland AFC; winger in Sunderland U21 squad.",
    currentTmValueEur: 300000,
  },
  "cmuihw3f20bossexp0tx1r70j": { // Ben Middlemas
    status: "left_league",
    newClub: "Swindon Town",
    loanClub: "",
    transferDate: "2026-01-15",
    sourceUrl: "https://www.transfermarkt.com/ben-middlemas/profil/spieler/922463",
    confidence: "high",
    notes: "Transferred permanently to Swindon Town in January 2026.",
    currentTmValueEur: 150000,
  },
  "cmuihw4rw0d57sexp7wx2eela": { // Jocelin Ta Bi
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/jocelin-ta-bi/profil/spieler/1322090",
    confidence: "high",
    notes: "Confirmed at Sunderland AFC; right winger in first-team squad.",
    currentTmValueEur: 2500000,
  },

  // --- TOTTENHAM HOTSPUR ---
  "cmuihvyqu064ksexp6ttb66ol": { // Guglielmo Vicario
    status: "on_loan_out",
    newClub: "",
    loanClub: "Juventus FC",
    transferDate: "2026-08-15",
    sourceUrl: "https://www.transfermarkt.com/guglielmo-vicario/profil/spieler/286047",
    confidence: "high",
    notes: "On season-long loan at Juventus FC (Serie A) from Tottenham Hotspur.",
    currentTmValueEur: 18000000,
  },
  "cmuihvzbi0776sexp57a41jij": { // Cristian Romero
    status: "left_league",
    newClub: "Atlético de Madrid",
    loanClub: "",
    transferDate: "2026-07-20",
    sourceUrl: "https://www.transfermarkt.com/cristian-romero/profil/spieler/355915",
    confidence: "high",
    notes: "Transferred permanently to Atlético de Madrid in July 2026.",
    currentTmValueEur: 45000000,
  },
  "cmuihw0k208mqsexpa280gxoz": { // Djed Spence
    status: "left_league",
    newClub: "Inter Milan",
    loanClub: "",
    transferDate: "2026-08-10",
    sourceUrl: "https://www.transfermarkt.com/djed-spence/profil/spieler/483348",
    confidence: "high",
    notes: "Completed permanent transfer to Inter Milan in August 2026.",
    currentTmValueEur: 18000000,
  },
  "cmuihw1dg09ewsexpvn4sq5qv": { // Radu Drăgușin
    status: "on_loan_out",
    newClub: "",
    loanClub: "ACF Fiorentina",
    transferDate: "2026-08-20",
    sourceUrl: "https://www.transfermarkt.com/radu-dragusin/profil/spieler/568559",
    confidence: "high",
    notes: "On season-long loan at ACF Fiorentina from Tottenham Hotspur.",
    currentTmValueEur: 25000000,
  },
  "cmuihw1dg09eysexpet5m9lol": { // Pape Matar Sarr
    status: "on_loan_out",
    newClub: "",
    loanClub: "Juventus FC",
    transferDate: "2026-08-18",
    sourceUrl: "https://www.transfermarkt.com/pape-matar-sarr/profil/spieler/568693",
    confidence: "high",
    notes: "On season-long loan at Juventus FC from Tottenham Hotspur for 2026/27.",
    currentTmValueEur: 45000000,
  },
  "cmuihw43x0cdvsexp3pa7ja9f": { // Yusuf Akhamrich
    status: "on_loan_out",
    newClub: "",
    loanClub: "Leyton Orient",
    transferDate: "2026-07-11",
    sourceUrl: "https://www.transfermarkt.com/yusuf-akhamrich/profil/spieler/1047345",
    confidence: "high",
    notes: "On loan at Leyton Orient from Tottenham U21 until June 2027; contract runs to 2028.",
    currentTmValueEur: 250000,
  },
  "cmuihw3et0bh7sexp7u5xy2q2": { // Rio Kyerematen
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/rio-kyerematen/profil/spieler/882172",
    confidence: "high",
    notes: "Confirmed at Tottenham Hotspur; central midfielder in Tottenham U21.",
    currentTmValueEur: 250000,
  },
  "cmuihw3eu0bi6sexppo7k8vr8": { // Luca Gunter
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/luca-gunter/profil/spieler/888637",
    confidence: "high",
    notes: "Confirmed at Tottenham Hotspur; goalkeeper in Tottenham U21 contracted to 2029.",
    currentTmValueEur: 200000,
  },
  "cmuihw43j0c49sexp7kzw6j1g": { // Callum Olusesi
    status: "confirmed_same_club",
    newClub: "",
    loanClub: "",
    transferDate: "",
    sourceUrl: "https://www.transfermarkt.com/callum-olusesi/profil/spieler/985546",
    confidence: "high",
    notes: "Confirmed at Tottenham Hotspur; contracted professional midfielder to 2029.",
    currentTmValueEur: 500000,
  },
};

function recomputeAge(dobStr: string, refDate = new Date("2026-09-30")): number {
  const d = new Date(dobStr);
  let age = refDate.getFullYear() - d.getFullYear();
  const m = refDate.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

function recomputeVerifyReason(mv: number, age: number): { reason: string; stillFlagged: boolean } {
  const isHighValue = mv >= 10000000;
  const isYoung = age <= 21;
  if (isHighValue && isYoung) {
    return {
      reason: `High market value (EUR ${mv.toLocaleString()}) and young age (${age})`,
      stillFlagged: true,
    };
  } else if (isHighValue) {
    return {
      reason: `High market value (EUR ${mv.toLocaleString()}) >= 10M`,
      stillFlagged: true,
    };
  } else if (isYoung) {
    return {
      reason: `Young age (${age}) <= 21`,
      stillFlagged: true,
    };
  }
  return {
    reason: "Thresholds not met",
    stillFlagged: false,
  };
}

async function main() {
  const rawCsv = fs.readFileSync("detaches_to_verify.csv", "utf-8");
  const lines = rawCsv.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(",").map((s) => s.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((l) => {
    const cols = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.replace(/^"|"$/g, "").trim());
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = cols[i] || ""));
    return obj;
  });

  // Verify all 94 players exist in auditData
  for (const r of rows) {
    if (!auditData[r.playerId]) {
      throw new Error(`Missing audit data for player ${r.fullName} (${r.playerId})`);
    }
  }

  // Club ID lookup for transfers within file
  const CLUB_MAP: Record<string, string> = {
    "Chelsea FC": "cmuihqcpo00b1h29edf8q9ksb",
    "Crystal Palace": "cmuihqfqr00cqh29e2077zt3y",
    "Tottenham Hotspur": "cmuihpzs8003vh29eyrxt8nk5",
  };

  const changesList: any[] = [];
  const marketValueReviewList: any[] = [];
  const auditedRows: any[] = [];

  for (const r of rows) {
    const info = auditData[r.playerId];
    const mv = parseInt(r.marketValueEur || "0", 10);
    const recomputedAge = recomputeAge(r.dateOfBirth);
    const { reason: recomputedReason, stillFlagged } = recomputeVerifyReason(mv, recomputedAge);

    let finalClubId = r.clubId;
    let finalClubName = r.clubName;

    // Transfer within file rule
    if (info.status === "transferred_within_file") {
      const targetClubId = CLUB_MAP[info.newClub];
      if (!targetClubId) throw new Error(`Unknown club mapping for ${info.newClub}`);
      
      changesList.push({
        playerId: r.playerId,
        field: "clubId",
        old: r.clubId,
        new: targetClubId,
        sourceUrl: info.sourceUrl,
        confidence: info.confidence,
      });
      changesList.push({
        playerId: r.playerId,
        field: "clubName",
        old: r.clubName,
        new: info.newClub,
        sourceUrl: info.sourceUrl,
        confidence: info.confidence,
      });

      finalClubId = targetClubId;
      finalClubName = info.newClub;
    }

    // Check age diff
    if (String(recomputedAge) !== r.age) {
      changesList.push({
        playerId: r.playerId,
        field: "age",
        old: r.age,
        new: String(recomputedAge),
        sourceUrl: info.sourceUrl,
        confidence: info.confidence,
      });
    }

    // Check verifyReason diff
    if (recomputedReason !== r.verifyReason) {
      changesList.push({
        playerId: r.playerId,
        field: "verifyReason",
        old: r.verifyReason,
        new: recomputedReason,
        sourceUrl: info.sourceUrl,
        confidence: info.confidence,
      });
    }

    // Market value review (> 30% difference)
    const fileVal = mv;
    const currVal = info.currentTmValueEur;
    let diffPct = 0;
    if (fileVal === 0 && currVal > 0) {
      diffPct = 100;
    } else if (fileVal > 0) {
      diffPct = Math.abs(currVal - fileVal) / fileVal * 100;
    }

    if (diffPct > 30) {
      marketValueReviewList.push({
        playerId: r.playerId,
        fullName: r.fullName,
        fileValue: fileVal,
        currentValue: currVal,
        sourceUrl: info.sourceUrl,
        diffPercent: Math.round(diffPct),
      });
    }

    auditedRows.push({
      clubId: finalClubId,
      clubName: finalClubName,
      playerId: r.playerId,
      fullName: r.fullName,
      marketValueEur: r.marketValueEur,
      dateOfBirth: r.dateOfBirth,
      age: recomputedAge,
      verifyReason: recomputedReason,
      status: info.status,
      newClub: info.newClub,
      loanClub: info.loanClub,
      transferDate: info.transferDate,
      stillFlagged: stillFlagged ? "true" : "false",
      sourceUrl: info.sourceUrl,
      confidence: info.confidence,
      notes: info.notes,
    });
  }

  // 1. Output players_audited.csv
  const auditedHeader = "clubId,clubName,playerId,fullName,marketValueEur,dateOfBirth,age,verifyReason,status,newClub,loanClub,transferDate,stillFlagged,sourceUrl,confidence,notes\n";
  const auditedLines = auditedRows.map((r) =>
    `"${r.clubId}","${r.clubName}","${r.playerId}","${r.fullName.replace(/"/g, '""')}",${r.marketValueEur},"${r.dateOfBirth}",${r.age},"${r.verifyReason.replace(/"/g, '""')}","${r.status}","${r.newClub.replace(/"/g, '""')}","${r.loanClub.replace(/"/g, '""')}","${r.transferDate}","${r.stillFlagged}","${r.sourceUrl}","${r.confidence}","${r.notes.replace(/"/g, '""')}"`
  );
  fs.writeFileSync("players_audited.csv", auditedHeader + auditedLines.join("\n"), "utf-8");
  console.log(`✅ Generated players_audited.csv with ${auditedRows.length} rows.`);

  // 2. Output changes.csv
  const changesHeader = "playerId,field,old,new,sourceUrl,confidence\n";
  const changesLines = changesList.map((c) =>
    `"${c.playerId}","${c.field}","${String(c.old).replace(/"/g, '""')}","${String(c.new).replace(/"/g, '""')}","${c.sourceUrl}","${c.confidence}"`
  );
  fs.writeFileSync("changes.csv", changesHeader + changesLines.join("\n"), "utf-8");
  console.log(`✅ Generated changes.csv with ${changesList.length} rows.`);

  // 3. Output market_value_review.csv
  const mvHeader = "playerId,fullName,fileValue,currentValue,sourceUrl\n";
  const mvLines = marketValueReviewList.map((m) =>
    `"${m.playerId}","${m.fullName.replace(/"/g, '""')}",${m.fileValue},${m.currentValue},"${m.sourceUrl}"`
  );
  fs.writeFileSync("market_value_review.csv", mvHeader + mvLines.join("\n"), "utf-8");
  console.log(`✅ Generated market_value_review.csv with ${marketValueReviewList.length} players differing by > 30%.`);

  // Validation
  if (auditedRows.length !== rows.length) {
    throw new Error(`Row count mismatch: output ${auditedRows.length}, expected ${rows.length}`);
  }
  for (let i = 0; i < rows.length; i++) {
    if (auditedRows[i].playerId !== rows[i].playerId) {
      throw new Error(`Player ID mismatch at row ${i}: output ${auditedRows[i].playerId}, expected ${rows[i].playerId}`);
    }
  }
  console.log("✅ Validation passed: 94/94 rows and IDs match perfectly in the exact original order.");
}

main().catch(console.error);
