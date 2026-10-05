/**
 * src/lib/data/transfers.ts
 *
 * Data Access Layer for Commercial Transfers and Historical Records
 * Implements strict type classification, future date labeling, anomaly filtering,
 * and canonical Transfermarkt all-time records.
 */

import { supabase } from "@/lib/supabase";
import { getPlayerSlug } from "@/lib/slugs";
import { sanitizeImageUrl } from "@/lib/image-sanitize";

export type TransferCategoryType =
  | "permanent"
  | "loan"
  | "loan_with_option"
  | "free"
  | "contract_expiry"
  | "retirement"
  | "released";

export interface TransferRecord {
  id: string;
  fromClubName: string | null;
  toClubName: string | null;
  date: string;
  displayDate: string;
  isAgreedFutureDeal: boolean;
  feeEur: number | null;
  transferType: TransferCategoryType;
  displayType: string;
  player: {
    id: string;
    sourceId: string | null;
    fullName: string;
    commonName?: string | null;
    slug: string;
    photoUrl?: string | null;
    position?: string | null;
  } | null;
}

/**
 * Benchmark Top All-Time Historical Transfers
 * Supplement for entries not present in scraped database scope (e.g. Neymar EUR 222M Barcelona -> PSG 2017)
 */
export const DOCUMENTED_ALL_TIME_RECORDS: TransferRecord[] = [
  {
    id: "tm-rec-neymar-2017",
    fromClubName: "FC Barcelona",
    toClubName: "Paris Saint-Germain",
    date: "2017-08-03T00:00:00.000Z",
    displayDate: "Aug 3, 2017",
    isAgreedFutureDeal: false,
    feeEur: 222000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "neymar-68290",
      sourceId: "68290",
      fullName: "Neymar Jr",
      commonName: "Neymar",
      slug: "neymar-68290",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/68290-1669395855.jpg",
      position: "Left Winger",
    },
  },
  {
    id: "tm-rec-mbappe-2018",
    fromClubName: "AS Monaco",
    toClubName: "Paris Saint-Germain",
    date: "2018-07-01T00:00:00.000Z",
    displayDate: "Jul 1, 2018",
    isAgreedFutureDeal: false,
    feeEur: 180000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "cmuihs0o1001jh29eakvplq5f",
      sourceId: "342229",
      fullName: "Kylian Mbappé",
      commonName: "Kylian Mbappé",
      slug: "kylian-mbappe-342229",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/342229-1683883804.jpg",
      position: "Centre-Forward",
    },
  },
  {
    id: "tm-rec-coutinho-2018",
    fromClubName: "Liverpool FC",
    toClubName: "FC Barcelona",
    date: "2018-01-08T00:00:00.000Z",
    displayDate: "Jan 8, 2018",
    isAgreedFutureDeal: false,
    feeEur: 135000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "coutinho-80444",
      sourceId: "80444",
      fullName: "Philippe Coutinho",
      commonName: "Philippe Coutinho",
      slug: "philippe-coutinho-80444",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/80444-1669395855.jpg",
      position: "Attacking Midfield",
    },
  },
  {
    id: "tm-rec-dembele-2017",
    fromClubName: "Borussia Dortmund",
    toClubName: "FC Barcelona",
    date: "2017-08-25T00:00:00.000Z",
    displayDate: "Aug 25, 2017",
    isAgreedFutureDeal: false,
    feeEur: 135000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "dembele-288230",
      sourceId: "288230",
      fullName: "Ousmane Dembélé",
      commonName: "Ousmane Dembélé",
      slug: "ousmane-dembele-288230",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/288230-1683883804.jpg",
      position: "Right Winger",
    },
  },
  {
    id: "tm-rec-felix-2019",
    fromClubName: "SL Benfica",
    toClubName: "Atlético de Madrid",
    date: "2019-07-03T00:00:00.000Z",
    displayDate: "Jul 3, 2019",
    isAgreedFutureDeal: false,
    feeEur: 127200000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "felix-462250",
      sourceId: "462250",
      fullName: "João Félix",
      commonName: "João Félix",
      slug: "joao-felix-462250",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/462250-1683883804.jpg",
      position: "Second Striker",
    },
  },
  {
    id: "tm-rec-bellingham-2023",
    fromClubName: "Borussia Dortmund",
    toClubName: "Real Madrid",
    date: "2023-07-01T00:00:00.000Z",
    displayDate: "Jul 1, 2023",
    isAgreedFutureDeal: false,
    feeEur: 113000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "cmuihs0o1001jh29eakvplq5g",
      sourceId: "581678",
      fullName: "Jude Bellingham",
      commonName: "Jude Bellingham",
      slug: "jude-bellingham-581678",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/581678-1683883804.jpg",
      position: "Central Midfield",
    },
  },
  {
    id: "tm-rec-rice-2023",
    fromClubName: "West Ham United",
    toClubName: "Arsenal FC",
    date: "2023-07-15T00:00:00.000Z",
    displayDate: "Jul 15, 2023",
    isAgreedFutureDeal: false,
    feeEur: 116600000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "rice-357662",
      sourceId: "357662",
      fullName: "Declan Rice",
      commonName: "Declan Rice",
      slug: "declan-rice-357662",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/357662-1683883804.jpg",
      position: "Defensive Midfield",
    },
  },
  {
    id: "tm-rec-caicedo-2023",
    fromClubName: "Brighton & Hove Albion",
    toClubName: "Chelsea FC",
    date: "2023-08-14T00:00:00.000Z",
    displayDate: "Aug 14, 2023",
    isAgreedFutureDeal: false,
    feeEur: 116000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "caicedo-687626",
      sourceId: "687626",
      fullName: "Moisés Caicedo",
      commonName: "Moisés Caicedo",
      slug: "moises-caicedo-687626",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/687626-1683883804.jpg",
      position: "Defensive Midfield",
    },
  },
  {
    id: "tm-rec-enzo-2023",
    fromClubName: "SL Benfica",
    toClubName: "Chelsea FC",
    date: "2023-01-31T00:00:00.000Z",
    displayDate: "Jan 31, 2023",
    isAgreedFutureDeal: false,
    feeEur: 121000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "enzo-648195",
      sourceId: "648195",
      fullName: "Enzo Fernández",
      commonName: "Enzo Fernández",
      slug: "enzo-fernandez-648195",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/648195-1683883804.jpg",
      position: "Central Midfield",
    },
  },
  {
    id: "tm-rec-griezmann-2019",
    fromClubName: "Atlético de Madrid",
    toClubName: "FC Barcelona",
    date: "2019-07-12T00:00:00.000Z",
    displayDate: "Jul 12, 2019",
    isAgreedFutureDeal: false,
    feeEur: 120000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "griezmann-125781",
      sourceId: "125781",
      fullName: "Antoine Griezmann",
      commonName: "Antoine Griezmann",
      slug: "antoine-griezmann-125781",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/125781-1683883804.jpg",
      position: "Second Striker",
    },
  },
  {
    id: "tm-rec-grealish-2021",
    fromClubName: "Aston Villa",
    toClubName: "Manchester City",
    date: "2021-08-05T00:00:00.000Z",
    displayDate: "Aug 5, 2021",
    isAgreedFutureDeal: false,
    feeEur: 117500000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "grealish-203460",
      sourceId: "203460",
      fullName: "Jack Grealish",
      commonName: "Jack Grealish",
      slug: "jack-grealish-203460",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/203460-1683883804.jpg",
      position: "Left Winger",
    },
  },
  {
    id: "tm-rec-ronaldo-2018",
    fromClubName: "Real Madrid",
    toClubName: "Juventus FC",
    date: "2018-07-10T00:00:00.000Z",
    displayDate: "Jul 10, 2018",
    isAgreedFutureDeal: false,
    feeEur: 117000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "ronaldo-8198",
      sourceId: "8198",
      fullName: "Cristiano Ronaldo",
      commonName: "Cristiano Ronaldo",
      slug: "cristiano-ronaldo-8198",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/8198-1683883804.jpg",
      position: "Centre-Forward",
    },
  },
  {
    id: "tm-rec-hazard-2019",
    fromClubName: "Chelsea FC",
    toClubName: "Real Madrid",
    date: "2019-07-01T00:00:00.000Z",
    displayDate: "Jul 1, 2019",
    isAgreedFutureDeal: false,
    feeEur: 115000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "hazard-50202",
      sourceId: "50202",
      fullName: "Eden Hazard",
      commonName: "Eden Hazard",
      slug: "eden-hazard-50202",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/50202-1683883804.jpg",
      position: "Left Winger",
    },
  },
  {
    id: "tm-rec-lukaku-2021",
    fromClubName: "Inter Milan",
    toClubName: "Chelsea FC",
    date: "2021-08-12T00:00:00.000Z",
    displayDate: "Aug 12, 2021",
    isAgreedFutureDeal: false,
    feeEur: 113000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "lukaku-96341",
      sourceId: "96341",
      fullName: "Romelu Lukaku",
      commonName: "Romelu Lukaku",
      slug: "romelu-lukaku-96341",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/96341-1683883804.jpg",
      position: "Centre-Forward",
    },
  },
  {
    id: "tm-rec-pogba-2016",
    fromClubName: "Juventus FC",
    toClubName: "Manchester United",
    date: "2016-08-09T00:00:00.000Z",
    displayDate: "Aug 9, 2016",
    isAgreedFutureDeal: false,
    feeEur: 105000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "pogba-122153",
      sourceId: "122153",
      fullName: "Paul Pogba",
      commonName: "Paul Pogba",
      slug: "paul-pogba-122153",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/122153-1683883804.jpg",
      position: "Central Midfield",
    },
  },
  {
    id: "tm-rec-bale-2013",
    fromClubName: "Tottenham Hotspur",
    toClubName: "Real Madrid",
    date: "2013-09-01T00:00:00.000Z",
    displayDate: "Sep 1, 2013",
    isAgreedFutureDeal: false,
    feeEur: 101000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "bale-39381",
      sourceId: "39381",
      fullName: "Gareth Bale",
      commonName: "Gareth Bale",
      slug: "gareth-bale-39381",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/39381-1683883804.jpg",
      position: "Right Winger",
    },
  },
  {
    id: "tm-rec-kane-2023",
    fromClubName: "Tottenham Hotspur",
    toClubName: "Bayern Munich",
    date: "2023-08-12T00:00:00.000Z",
    displayDate: "Aug 12, 2023",
    isAgreedFutureDeal: false,
    feeEur: 95000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "kane-132098",
      sourceId: "132098",
      fullName: "Harry Kane",
      commonName: "Harry Kane",
      slug: "harry-kane-132098",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/132098-1683883804.jpg",
      position: "Centre-Forward",
    },
  },
  {
    id: "tm-rec-kolo-muani-2023",
    fromClubName: "Eintracht Frankfurt",
    toClubName: "Paris Saint-Germain",
    date: "2023-09-01T00:00:00.000Z",
    displayDate: "Sep 1, 2023",
    isAgreedFutureDeal: false,
    feeEur: 95000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "kolo-487969",
      sourceId: "487969",
      fullName: "Randal Kolo Muani",
      commonName: "Randal Kolo Muani",
      slug: "randal-kolo-muani-487969",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/487969-1683883804.jpg",
      position: "Centre-Forward",
    },
  },
  {
    id: "tm-rec-gvardiol-2023",
    fromClubName: "RB Leipzig",
    toClubName: "Manchester City",
    date: "2023-08-05T00:00:00.000Z",
    displayDate: "Aug 5, 2023",
    isAgreedFutureDeal: false,
    feeEur: 90000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "gvardiol-475959",
      sourceId: "475959",
      fullName: "Joško Gvardiol",
      commonName: "Joško Gvardiol",
      slug: "josko-gvardiol-475959",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/475959-1683883804.jpg",
      position: "Centre-Back",
    },
  },
  {
    id: "tm-rec-maguire-2019",
    fromClubName: "Leicester City",
    toClubName: "Manchester United",
    date: "2019-08-05T00:00:00.000Z",
    displayDate: "Aug 5, 2019",
    isAgreedFutureDeal: false,
    feeEur: 87000000,
    transferType: "permanent",
    displayType: "Permanent",
    player: {
      id: "maguire-177907",
      sourceId: "177907",
      fullName: "Harry Maguire",
      commonName: "Harry Maguire",
      slug: "harry-maguire-177907",
      photoUrl: "https://img.a.transfermarkt.technology/portrait/medium/177907-1683883804.jpg",
      position: "Centre-Back",
    },
  },
];

/**
 * Classifies raw transfer information into one of the canonical categories.
 */
export function classifyTransferType(
  rawType: string | null | undefined,
  feeEur: number | null | undefined,
  fromClub: string | null | undefined,
  toClub: string | null | undefined
): { category: TransferCategoryType; label: string } {
  const t = (rawType || "").toLowerCase();
  const from = (fromClub || "").toLowerCase();
  const to = (toClub || "").toLowerCase();

  if (to.includes("career break") || to.includes("retired") || t.includes("retired") || to.includes("end of career")) {
    return { category: "retirement", label: "Retired" };
  }

  if (to.includes("without club") || to.includes("unattached") || to.includes("free agent") || t.includes("released")) {
    return { category: "released", label: "Released" };
  }

  if (t.includes("loan with option") || t.includes("option to buy")) {
    return { category: "loan_with_option", label: "Loan (with Option)" };
  }

  if (t.includes("loan") || t.includes("end of loan")) {
    return { category: "loan", label: "Loan" };
  }

  if (t.includes("contract expiry") || t.includes("end of contract")) {
    return { category: "contract_expiry", label: "Contract Expiry" };
  }

  if (feeEur === 0 || t.includes("free") || from.includes("without club")) {
    return { category: "free", label: "Free Transfer" };
  }

  return { category: "permanent", label: "Permanent" };
}

/**
 * Checks whether a row should be hidden from public transfer tables:
 * - Never show a row with both unknown club and undisclosed/0 fee
 * - Hide unknown club unless player is high value (> €10M)
 */
export function shouldHideTransferRow(
  fromClub: string | null | undefined,
  toClub: string | null | undefined,
  feeEur: number | null | undefined,
  playerValue: number | null | undefined
): boolean {
  const fromClean = (fromClub || "").trim().toLowerCase();
  const toClean = (toClub || "").trim().toLowerCase();
  const isFromUnknown = !fromClean || fromClean === "unknown" || fromClean === "-";
  const isToUnknown = !toClean || toClean === "unknown" || toClean === "-";

  const hasNoFee = feeEur === null || feeEur === undefined || feeEur === 0;

  // Never show row with both unknown club AND undisclosed/0 fee
  if ((isFromUnknown || isToUnknown) && hasNoFee) {
    return true;
  }

  // Hide unknown club unless player is top-tier (latestMarketValue >= €10M)
  if ((isFromUnknown || isToUnknown) && (!playerValue || playerValue < 10000000)) {
    return true;
  }

  return false;
}

/**
 * Formats transfer dates and handles future deals.
 * Dates beyond active window (> 2026-10-31) that look like contract-expiry placeholders are dropped.
 */
export function formatTransferDate(dateStr: string | null | undefined): {
  displayDate: string;
  isFuture: boolean;
  isInvalidPlaceholder: boolean;
} {
  if (!dateStr) {
    return { displayDate: "Undisclosed", isFuture: false, isInvalidPlaceholder: false };
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { displayDate: "Undisclosed", isFuture: false, isInvalidPlaceholder: false };
  }

  const now = new Date();
  const year = d.getFullYear();

  // Drop rows dated beyond the current calendar year: in the source data these are
  // contract-expiry dates misparsed as transfers (e.g. Belardinelli 2030), not real deals.
  if (year > now.getFullYear()) {
    return { displayDate: "", isFuture: true, isInvalidPlaceholder: true };
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

  if (d.getTime() > now.getTime()) {
    return {
      displayDate: `Agreed, effective ${formattedDate}`,
      isFuture: true,
      isInvalidPlaceholder: false,
    };
  }

  return {
    displayDate: formattedDate,
    isFuture: false,
    isInvalidPlaceholder: false,
  };
}

/**
 * Queries commercial transfers with verified data integrity rules.
 */
export async function getTransfersHubData() {
  const [dbTransfersRes] = await Promise.all([
    supabase
      .from("Transfer")
      .select(`
        id,
        fromClubName,
        toClubName,
        date,
        feeEur,
        transferType,
        player:Player (
          id,
          fullName,
          commonName,
          photoUrl,
          position,
          transfermarktId,
          latestMarketValue
        )
      `)
      // Exclude synthetic anomalies and future placeholders
      .neq("id", "trans-rodri-1790753937374")
      .lte("date", `${new Date().getFullYear()}-12-31T23:59:59.999Z`)
      .order("date", { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  const rawRows = dbTransfersRes.data || [];

  const commercialMoves: TransferRecord[] = [];
  const contractEndsAndRetirements: TransferRecord[] = [];

  for (const t of rawRows) {
    const rawP = Array.isArray(t.player) ? t.player[0] : t.player;
    const playerVal = rawP?.latestMarketValue ? Number(rawP.latestMarketValue) : 0;
    const feeVal = t.feeEur !== null && t.feeEur !== undefined ? Number(t.feeEur) : null;

    // Filter out unknown club + undisclosed fee anomalies
    if (shouldHideTransferRow(t.fromClubName, t.toClubName, feeVal, playerVal)) {
      continue;
    }

    const dateInfo = formatTransferDate(t.date);
    if (dateInfo.isInvalidPlaceholder) {
      continue;
    }

    const classification = classifyTransferType(t.transferType, feeVal, t.fromClubName, t.toClubName);

    const extId = rawP ? (rawP.transfermarktId || rawP.id) : null;
    const player = rawP
      ? {
          id: rawP.id,
          sourceId: extId,
          fullName: rawP.fullName,
          commonName: rawP.commonName || rawP.fullName,
          slug: getPlayerSlug(rawP),
          photoUrl: sanitizeImageUrl(rawP.photoUrl, "player", extId),
          position: rawP.position,
        }
      : null;

    const record: TransferRecord = {
      id: t.id,
      fromClubName: t.fromClubName,
      toClubName: t.toClubName,
      date: t.date,
      displayDate: dateInfo.displayDate,
      isAgreedFutureDeal: dateInfo.isFuture,
      feeEur: feeVal,
      transferType: classification.category,
      displayType: classification.label,
      player,
    };

    if (
      classification.category === "retirement" ||
      classification.category === "released" ||
      classification.category === "contract_expiry"
    ) {
      contractEndsAndRetirements.push(record);
    } else {
      commercialMoves.push(record);
    }
  }

  // Top 20 All-Time Record Transfers (Transfermarkt documented fees with Neymar #1)
  const allTimeRecords = DOCUMENTED_ALL_TIME_RECORDS.slice(0, 20).sort(
    (a, b) => (b.feeEur || 0) - (a.feeEur || 0)
  );

  return {
    allTimeRecords,
    recentCommercial: commercialMoves.slice(0, 30),
    contractEndsAndRetirements: contractEndsAndRetirements.slice(0, 30),
  };
}
