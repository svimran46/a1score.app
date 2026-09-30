/**
 * src/lib/league-mappings.ts
 *
 * Authoritative mapping from FotMob team IDs to canonical Transfermarkt IDs, DB club IDs, and club names.
 * Ensures 100% resolution for promoted clubs, accent differences, and alternative spellings.
 */

export const FOTMOB_TEAM_MAPPINGS: Record<number, { name?: string; tmId?: string; clubId?: string }> = {
  "1567": {
    "name": "CD Santa Clara",
    "tmId": "2423",
    "clubId": "cmuihq2dd005bh29e4dnqmt8q"
  },
  "1634": {
    "name": "FC Famalicão",
    "tmId": "3329",
    "clubId": "cmuihq66x007fh29elwopl3td"
  },
  "1786": {
    "name": "Académico Viseu FC",
    "tmId": "7788",
    "clubId": "cmundu9bs0009zjoe6j4u149k"
  },
  "6379": {
    "name": "Paris FC",
    "tmId": "10004",
    "clubId": "cmuihnihk000bb23fi54xeh0d"
  },
  "6413": {
    "name": "PEC Zwolle",
    "tmId": "1269",
    "clubId": "cmuihoq0l002hb23fy05xkd46"
  },
  "6414": {
    "name": "SC Telstar",
    "tmId": "1434",
    "clubId": "cmuihpzab003lh29emxyfpwie"
  },
  "6422": {
    "name": "Fortuna Sittardia Combinatie",
    "tmId": "385",
    "clubId": "cmuihq80t008hh29edci2vstb"
  },
  "6433": {
    "name": "Go Ahead Eagles",
    "tmId": "1435",
    "clubId": "cmuihpzcq003nh29eowpx0ee9"
  },
  "6504": {
    "name": "AC Monza",
    "tmId": "2919",
    "clubId": "cmuihq4hx006hh29enfwx58cb"
  },
  "7788": {
    "name": "SC Cambuur Leeuwarden",
    "tmId": "133",
    "clubId": "cmuihpy3m002zh29ew56izgoh"
  },
  "7841": {
    "name": "Rio Ave FC",
    "tmId": "2425",
    "clubId": "cmuihq2g9005fh29e1fanj221"
  },
  "7842": {
    "name": "GD Estoril Praia",
    "tmId": "1465",
    "clubId": "cmuihpzrk003th29ed2012pii"
  },
  "7844": {
    "name": "Vitória Guimarães SC",
    "tmId": "2420",
    "clubId": "cmuihq2b80059h29ezwhg3ewt"
  },
  "7881": {
    "name": "Venezia FC",
    "tmId": "607",
    "clubId": "cmuihqc8e00arh29e87zakfd6"
  },
  "7943": {
    "name": "US Sassuolo",
    "tmId": "6574",
    "clubId": "cmuihqd7y00b9h29e7s5ob4n6"
  },
  "8121": {
    "name": "Angers SCO",
    "tmId": "1420",
    "clubId": "cmuihpysp003bh29eh8ctgbgf"
  },
  "8149": {
    "name": "1.FC Union Berlin",
    "tmId": "89",
    "clubId": "cmuihqfy300cth29ewu9xjg4l"
  },
  "8178": {
    "name": "Bayer 04 Leverkusen",
    "tmId": "15",
    "clubId": "cmuihpzti003xh29ejh2oa78u"
  },
  "8226": {
    "name": "TSG 1899 Hoffenheim",
    "tmId": "533",
    "clubId": "cmuihqbor00adh29elg30kgzn"
  },
  "8232": {
    "name": "SV 07 Elversberg",
    "tmId": "64",
    "clubId": "cmundu7yx0005zjoeub3xwq73"
  },
  "8302": {
    "name": "Sevilla FC",
    "tmId": "368",
    "clubId": "cmuihq7is0085h29ez260bgnc"
  },
  "8305": {
    "name": "Getafe CF",
    "tmId": "3709",
    "clubId": "cmuihq7jc0087h29e9nzoxp6q"
  },
  "8315": {
    "name": "Athletic Bilbao",
    "tmId": "621",
    "clubId": "cmuihqcpi00azh29e0ihjlfsq"
  },
  "8348": {
    "name": "Moreirense FC",
    "tmId": "979",
    "clubId": "cmuihqgut00dbh29eg5w6uzl6"
  },
  "8358": {
    "name": "SC Freiburg",
    "tmId": "60",
    "clubId": "cmuihqc7a00anh29ekc5foq1r"
  },
  "8370": {
    "name": "Rayo Vallecano",
    "tmId": "367",
    "clubId": "cmuihq7gc0083h29exnlti38f"
  },
  "8371": {
    "name": "CA Osasuna",
    "tmId": "331",
    "clubId": "cmuihq61m0079h29efscx2qh5"
  },
  "8406": {
    "name": "FC Augsburg",
    "tmId": "167",
    "clubId": "cmuihq0jy004bh29e4vb2kecf"
  },
  "8455": {
    "name": "Chelsea FC",
    "tmId": "631",
    "clubId": "cmuihqcpo00b1h29edf8q9ksb"
  },
  "8456": {
    "name": "Manchester City",
    "tmId": "281",
    "clubId": "cmuihq3vs0069h29ebm5xqhye"
  },
  "8460": {
    "name": "SC Paderborn 07",
    "tmId": "127",
    "clubId": "cmuihor87002jb23f3u8w2hsf"
  },
  "8463": {
    "name": "Leeds United",
    "tmId": "399",
    "clubId": "cmuihq8hv008ph29ejwdrv7xd"
  },
  "8464": {
    "name": "NEC Nijmegen",
    "tmId": "467",
    "clubId": "cmuihqali009vh29e33t7l1kw"
  },
  "8472": {
    "name": "Sunderland AFC",
    "tmId": "289",
    "clubId": "cmuihq47i006bh29e3kejf8oh"
  },
  "8521": {
    "name": "Stade Brestois 29",
    "tmId": "3911",
    "clubId": "cmuihq8e9008lh29ed3170t61"
  },
  "8524": {
    "name": "Atalanta BC",
    "tmId": "800",
    "clubId": "cmuihqf7m00ceh29eo8vo509b"
  },
  "8525": {
    "name": "Willem II Tilburg",
    "tmId": "403",
    "clubId": "cmuihq8us008vh29erfb05jp3"
  },
  "8529": {
    "name": "Cagliari Calcio",
    "tmId": "1390",
    "clubId": "cmuihpy660033h29egvkno1rw"
  },
  "8535": {
    "name": "ACF Fiorentina",
    "tmId": "430",
    "clubId": "cmuihqa6q009nh29eeao6masx"
  },
  "8543": {
    "name": "Società Sportiva Lazio S.p.A.",
    "tmId": "398",
    "clubId": "cmuihq8em008nh29e1swv1hng"
  },
  "8558": {
    "name": "RCD Espanyol Barcelona",
    "tmId": "714",
    "clubId": "cmuihqdqh00bnh29e1s0pnnhq"
  },
  "8560": {
    "name": "Real Sociedad",
    "tmId": "681",
    "clubId": "cmuihqdop00bfh29ezli7oevn"
  },
  "8564": {
    "name": "Inter Milan",
    "tmId": "46",
    "clubId": "cmuihqald009th29eqj2x21un"
  },
  "8581": {
    "name": "Levante UD",
    "tmId": "3368",
    "clubId": "cmuihq6me007nh29ezmai1c1u"
  },
  "8583": {
    "name": "AJ Auxerre",
    "tmId": "290",
    "clubId": "cmuihq4bo006eh29ep1anor93"
  },
  "8586": {
    "name": "Tottenham Hotspur",
    "tmId": "148",
    "clubId": "cmuihpzs8003vh29eyrxt8nk5"
  },
  "8588": {
    "name": "RC Lens",
    "tmId": "826",
    "clubId": "cmuihqfi000cjh29exp3khwxc"
  },
  "8592": {
    "name": "Olympique Marseille",
    "tmId": "244",
    "clubId": "cmuihq2sw005jh29e5ugg799e"
  },
  "8593": {
    "name": "Ajax Amsterdam",
    "tmId": "610",
    "clubId": "cmuihqce400ath29e227zx42b"
  },
  "8600": {
    "name": "Udinese Calcio",
    "tmId": "410",
    "clubId": "cmuihq93e0093h29eq2t4j538"
  },
  "8603": {
    "name": "Real Betis Balompié",
    "tmId": "150",
    "clubId": "cmuihpzzw003zh29esiigzvql"
  },
  "8611": {
    "name": "FC Twente Enschede",
    "tmId": "317",
    "clubId": "cmuihq5k60071h29e42akmqnf"
  },
  "8614": {
    "name": "Sparta Rotterdam",
    "tmId": "468",
    "clubId": "cmuihqaou009xh29ehzb7sgiz"
  },
  "8633": {
    "name": "Real Madrid",
    "tmId": "418",
    "clubId": "cmuihq9wg009hh29ermlar2c7"
  },
  "8634": {
    "name": "FC Barcelona",
    "tmId": "131",
    "clubId": "cmuihoy3o002vb23f8egwo6vd"
  },
  "8636": {
    "name": "Inter Milan",
    "tmId": "46",
    "clubId": "cmuihqald009th29eqj2x21un"
  },
  "8639": {
    "name": "LOSC Lille",
    "tmId": "1082",
    "clubId": "cmuihnzfj0017b23f7qeka8w7"
  },
  "8640": {
    "name": "PSV Eindhoven",
    "tmId": "383",
    "clubId": "cmuihq7yg008dh29eacwmi5po"
  },
  "8650": {
    "name": "Liverpool FC",
    "tmId": "31",
    "clubId": "cmuihq5k0006zh29erp4cykkk"
  },
  "8667": {
    "name": "Hull City",
    "tmId": "3008",
    "clubId": "cmuihq56p006vh29efww9bqgh"
  },
  "8668": {
    "name": "Everton FC",
    "tmId": "29",
    "clubId": "cmuihq4bo006fh29ef9sfod5p"
  },
  "8669": {
    "name": "Coventry City",
    "tmId": "990",
    "clubId": "cmundu5xu0001zjoe1l91im6d"
  },
  "8674": {
    "name": "FC Groningen",
    "tmId": "202",
    "clubId": "cmuihq181004ph29eat3v78na"
  },
  "8678": {
    "name": "AFC Bournemouth",
    "tmId": "989",
    "clubId": "cmuihqh6y00dfh29eokvzxktp"
  },
  "8682": {
    "name": "Le Mans FC",
    "tmId": "1164",
    "clubId": "cmundu8pm0007zjoeofq74h3t"
  },
  "8686": {
    "name": "Associazione Sportiva Roma",
    "tmId": "12",
    "clubId": "cmuihoj9l0025b23fj4mplye4"
  },
  "8689": {
    "name": "FC Lorient",
    "tmId": "1158",
    "clubId": "cmuihodrf001xb23fkcn0k6ut"
  },
  "8696": {
    "name": "Racing Santander",
    "tmId": "630",
    "clubId": "cmundu78o0003zjoefys30gje"
  },
  "8697": {
    "name": "SV Werder Bremen",
    "tmId": "86",
    "clubId": "cmuihqfqk00cnh29e7bfyem85"
  },
  "8722": {
    "name": "1.FC Köln",
    "tmId": "3",
    "clubId": "cmuihq50l006th29e3bm3uces"
  },
  "9746": {
    "name": "Le Havre AC",
    "tmId": "738",
    "clubId": "cmuihqelr00bzh29ek4d30ziu"
  },
  "9748": {
    "name": "Olympique Lyon",
    "tmId": "1041",
    "clubId": "cmuihnsd9000tb23f30w9l9tm"
  },
  "9764": {
    "name": "Gil Vicente FC",
    "tmId": "2424",
    "clubId": "cmuihq2ed005dh29erzb2qsjl"
  },
  "9768": {
    "name": "Sporting CP",
    "tmId": "336",
    "clubId": "cmuihq6jo007lh29e9jpaabxs"
  },
  "9772": {
    "name": "SL Benfica",
    "tmId": "294",
    "clubId": "cmuihq4q6006lh29eutf0qltf"
  },
  "9773": {
    "name": "FC Porto",
    "tmId": "720",
    "clubId": "cmuihqe6h00brh29ew01veugs"
  },
  "9780": {
    "name": "FC Alverca",
    "tmId": "2521",
    "clubId": "cmuihq3b2005vh29e4cxx0zua"
  },
  "9783": {
    "name": "Deportivo de La Coruña",
    "tmId": "897",
    "clubId": "cmuihqg6y00cvh29elaxzcvzv"
  },
  "9788": {
    "name": "Borussia Mönchengladbach",
    "tmId": "18",
    "clubId": "cmuihq0qz004fh29e00fpn7fy"
  },
  "9789": {
    "name": "Borussia Dortmund",
    "tmId": "16",
    "clubId": "cmuihq09e0045h29ednnt1hkq"
  },
  "9790": {
    "name": "Hamburger SV",
    "tmId": "41",
    "clubId": "cmuihq9070091h29ex9cb7wyt"
  },
  "9804": {
    "name": "Torino FC",
    "tmId": "416",
    "clubId": "cmuihq9hw0099h29erttwt92h"
  },
  "9810": {
    "name": "Eintracht Frankfurt",
    "tmId": "24",
    "clubId": "cmuihq2b80057h29e0r17uj2f"
  },
  "9823": {
    "name": "Bayern Munich",
    "tmId": "27",
    "clubId": "cmuihq3qa0061h29eyxx4xw43"
  },
  "9825": {
    "name": "Arsenal FC",
    "tmId": "11",
    "clubId": "cmuiho5do001hb23froc57owj"
  },
  "9826": {
    "name": "Crystal Palace",
    "tmId": "873",
    "clubId": "cmuihqfqr00cqh29e2077zt3y"
  },
  "9829": {
    "name": "AS Monaco",
    "tmId": "162",
    "clubId": "cmuihq0az0047h29ew2gfpbqj"
  },
  "9831": {
    "name": "OGC Nice",
    "tmId": "417",
    "clubId": "cmuihq9ie009bh29e4ay5p2yp"
  },
  "9847": {
    "name": "Paris Saint-Germain",
    "tmId": "583",
    "clubId": "cmuihqbws00ajh29e1ujz5fht"
  },
  "9848": {
    "name": "RC Strasbourg Alsace",
    "tmId": "667",
    "clubId": "cmuihqd8900bbh29em5y4p2o4"
  },
  "9851": {
    "name": "Stade Rennais FC",
    "tmId": "273",
    "clubId": "cmuihq3s40065h29eahz6rosv"
  },
  "9857": {
    "name": "Bologna Football Club 1909",
    "tmId": "1025",
    "clubId": "cmuihnmx8000jb23fowusi2kw"
  },
  "9864": {
    "name": "Málaga CF",
    "tmId": "1084",
    "clubId": "cmuiho0ii0019b23fvb7o5lmu"
  },
  "9866": {
    "name": "Deportivo Alavés",
    "tmId": "1108",
    "clubId": "cmuiho7e5001lb23fhy6pl2ep"
  },
  "9875": {
    "name": "SSC Napoli",
    "tmId": "6195",
    "clubId": "cmuihqcp500axh29eqi1p52xi"
  },
  "9879": {
    "name": "Fulham FC",
    "tmId": "931",
    "clubId": "cmuihqg9600cxh29echnkyx9e"
  },
  "9885": {
    "name": "Juventus FC",
    "tmId": "506",
    "clubId": "cmuihqb7i00a9h29e7t17vakf"
  },
  "9888": {
    "name": "US Lecce",
    "tmId": "1005",
    "clubId": "cmuihnki5000fb23fj5zntsyp"
  },
  "9891": {
    "name": "Frosinone Calcio",
    "tmId": "8970",
    "clubId": "cmuihqgcj00d1h29e5nz2aiov"
  },
  "9902": {
    "name": "Ipswich Town",
    "tmId": "677",
    "clubId": "cmuihqdak00bdh29e51a0c9yd"
  },
  "9905": {
    "name": "1.FSV Mainz 05",
    "tmId": "39",
    "clubId": "cmuihq84d008jh29e385ruvj0"
  },
  "9906": {
    "name": "Atlético de Madrid",
    "tmId": "13",
    "clubId": "cmuihotfm002nb23fe7004xbm"
  },
  "9908": {
    "name": "FC Utrecht",
    "tmId": "200",
    "clubId": "cmuihq181004nh29e2ib1sw4p"
  },
  "9910": {
    "name": "Celta de Vigo",
    "tmId": "940",
    "clubId": "cmuihqg9e00czh29eqgxwp7l7"
  },
  "9937": {
    "name": "Brentford FC",
    "tmId": "1148",
    "clubId": "cmuihocpq001vb23fu3cm5yh8"
  },
  "9941": {
    "name": "FC Toulouse",
    "tmId": "415",
    "clubId": "cmuihq9dj0097h29elsved1su"
  },
  "10167": {
    "name": "Parma Calcio 1913",
    "tmId": "130",
    "clubId": "cmuihouiw002pb23fjq3m9qng"
  },
  "10171": {
    "name": "Como 1907",
    "tmId": "1047",
    "clubId": "cmuihntg0000vb23fquzb7c6q"
  },
  "10189": {
    "name": "FC Schalke 04",
    "tmId": "33",
    "clubId": "cmuihq5qq0075h29elabq5hjd"
  },
  "10203": {
    "name": "Nottingham Forest",
    "tmId": "703",
    "clubId": "cmuihqdq000bkh29et7iwzrfd"
  },
  "10204": {
    "name": "Brighton & Hove Albion",
    "tmId": "1237",
    "clubId": "cmuihomne002bb23fq0sdhdrm"
  },
  "10205": {
    "name": "Villarreal CF",
    "tmId": "1050",
    "clubId": "cmuihnwfv0011b23f8wv3zc51"
  },
  "10212": {
    "name": "CS Marítimo",
    "tmId": "1301",
    "clubId": "cmuihovp7002rb23fxfslsjdn"
  },
  "10214": {
    "name": "CD Nacional",
    "tmId": "982",
    "clubId": "cmuihqgr500d7h29e04mjd6zg"
  },
  "10217": {
    "name": "ADO Den Haag",
    "tmId": "868",
    "clubId": "cmuihop03002fb23ffjr299x3"
  },
  "10218": {
    "name": "Excelsior Rotterdam",
    "tmId": "798",
    "clubId": "cmuihqf1z00c9h29ewetm83qg"
  },
  "10228": {
    "name": "SC Heerenveen",
    "tmId": "306",
    "clubId": "cmuihq5gp006xh29ew3zgy2a2"
  },
  "10229": {
    "name": "AZ Alkmaar",
    "tmId": "1090",
    "clubId": "cmuiho33d001db23ffg0co70a"
  },
  "10233": {
    "name": "Genoa CFC",
    "tmId": "252",
    "clubId": "cmuihq3ak005th29eolz9qqct"
  },
  "10235": {
    "name": "Feyenoord Rotterdam",
    "tmId": "234",
    "clubId": "cmuihq1t5004zh29exb9q00c1"
  },
  "10242": {
    "name": "ESTAC Troyes",
    "tmId": "1095",
    "clubId": "cmuiho49g001fb23fa7sw5ed8"
  },
  "10252": {
    "name": "Aston Villa",
    "tmId": "405",
    "clubId": "cmuihq8vi008xh29edz4vg4xw"
  },
  "10260": {
    "name": "Manchester United",
    "tmId": "985",
    "clubId": "cmuihqgxr00ddh29e8cr2u808"
  },
  "10261": {
    "name": "Newcastle United",
    "tmId": "762",
    "clubId": "cmuihqepp00c5h29e6dizfj3r"
  },
  "10264": {
    "name": "SC Braga",
    "tmId": "1075",
    "clubId": "cmuihnyer0015b23fholjonq1"
  },
  "10267": {
    "name": "Valencia CF",
    "tmId": "1049",
    "clubId": "cmuihnufg000xb23fs4poj6rc"
  },
  "10268": {
    "name": "Elche CF",
    "tmId": "1531",
    "clubId": "cmuihq03y0041h29ezh2jdh2h"
  },
  "10269": {
    "name": "VfB Stuttgart",
    "tmId": "79",
    "clubId": "cmuihqeq600c7h29ej46szm8f"
  },
  "158085": {
    "name": "FC Arouca",
    "tmId": "8024",
    "clubId": "cmuihqf7m00cfh29exy9mxhu8"
  },
  "178475": {
    "name": "RB Leipzig",
    "tmId": "23826",
    "clubId": "cmuihq1z60055h29emzy2ewj7"
  },
  "212821": {
    "name": "Casa Pia AC",
    "tmId": "3268",
    "clubId": "cmuihq5nq0073h29e11xogoc5"
  },
  "1074320": {
    "name": "CF Estrela Amadora",
    "tmId": "2431",
    "clubId": "cmuihq2sq005hh29en9069nxw"
  }
};
