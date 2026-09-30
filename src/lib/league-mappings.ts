/**
 * src/lib/league-mappings.ts
 *
 * Authoritative mapping from FotMob team IDs to canonical Transfermarkt IDs and club names.
 * Ensures 100% resolution for promoted clubs, accent differences, and alternative spellings.
 */

export const FOTMOB_TEAM_MAPPINGS: Record<number, { name?: string; tmId?: string }> = {
  // Premier League (GB1 - 47)
  8669: { name: "Coventry City", tmId: "990" },
  8667: { name: "Hull City", tmId: "3008" },
  9902: { name: "Ipswich Town", tmId: "677" },
  8456: { name: "Manchester City", tmId: "281" },
  9825: { name: "Arsenal FC", tmId: "11" },
  8650: { name: "Liverpool FC", tmId: "31" },
  8455: { name: "Chelsea FC", tmId: "631" },
  10260: { name: "Manchester United", tmId: "985" },
  8586: { name: "Tottenham Hotspur", tmId: "148" },
  10261: { name: "Newcastle United", tmId: "762" },
  10252: { name: "Aston Villa", tmId: "405" },
  9826: { name: "Crystal Palace", tmId: "873" },
  9937: { name: "Brentford FC", tmId: "1148" },
  10204: { name: "Brighton & Hove Albion", tmId: "1237" },
  9879: { name: "Fulham FC", tmId: "931" },
  8678: { name: "AFC Bournemouth", tmId: "989" },
  8668: { name: "Everton FC", tmId: "29" },
  10203: { name: "Nottingham Forest", tmId: "703" },
  8463: { name: "Leeds United", tmId: "399" },
  8472: { name: "Sunderland AFC", tmId: "289" },

  // LaLiga (ES1 - 87)
  9906: { name: "Atlético de Madrid", tmId: "13" },
  9783: { name: "Deportivo de La Coruña", tmId: "897" },
  8315: { name: "Athletic Bilbao", tmId: "621" },
  9910: { name: "Celta de Vigo", tmId: "940" },
  8696: { name: "Racing Santander", tmId: "630" },
  9864: { name: "Málaga CF", tmId: "1084" },

  // Bundesliga (L1 - 54)
  9823: { name: "Bayern Munich", tmId: "27" },
  8232: { name: "SV 07 Elversberg", tmId: "64" },
  8460: { name: "SC Paderborn 07", tmId: "127" },

  // Ligue 1 (FR1 - 53)
  9851: { name: "Stade Rennais FC", tmId: "273" },
  8682: { name: "Le Mans FC", tmId: "1164" },

  // Liga Portugal (PO1 - 61)
  1074320: { name: "CF Estrela Amadora", tmId: "2431" },
  7844: { name: "Vitória Guimarães SC", tmId: "2420" },
  1786: { name: "Académico Viseu FC", tmId: "7788" },
  10212: { name: "CS Marítimo", tmId: "1301" },

  // Eredivisie (NL1 - 57)
  7788: { name: "SC Cambuur Leeuwarden", tmId: "133" },
  10217: { name: "ADO Den Haag", tmId: "868" },
};
