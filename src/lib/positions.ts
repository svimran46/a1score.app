/**
 * src/lib/positions.ts
 *
 * Canonical Position Model for a1score.app
 * Provides a single source of truth for football positions across all pages:
 * Maps detailed positions (e.g. "Right Winger", "Centre-Back", "Central Midfield")
 * to standard position groups ("GK", "DEF", "MID", "ATT") and localized/formatted labels.
 */

export type PositionGroup = "GK" | "DEF" | "MID" | "ATT";

export interface CanonicalPosition {
  detailed: string;
  group: PositionGroup;
  groupLabel: string;
  order: number;
}

export const POSITION_GROUP_LABELS: Record<PositionGroup, string> = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  ATT: "Forwards",
};

export const POSITION_GROUP_ORDER: Record<PositionGroup, number> = {
  GK: 1,
  DEF: 2,
  MID: 3,
  ATT: 4,
};

/**
 * Normalizes any raw position string from Transfermarkt, FotMob, or DB
 * to a canonical detailed position and standard group.
 */
export function getCanonicalPosition(rawPosition?: string | null): CanonicalPosition {
  if (!rawPosition || typeof rawPosition !== "string") {
    return {
      detailed: "Unknown",
      group: "MID", // fallback group
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 99,
    };
  }

  const p = rawPosition.trim().toLowerCase();

  // 1. Goalkeepers
  if (p.includes("goalkeeper") || p.includes("torwart") || p === "gk" || p.includes("keeper")) {
    return {
      detailed: "Goalkeeper",
      group: "GK",
      groupLabel: POSITION_GROUP_LABELS.GK,
      order: 1,
    };
  }

  // 2. Defenders
  if (p.includes("centre-back") || p.includes("center-back") || p.includes("innenverteidiger") || p === "cb") {
    return {
      detailed: "Centre-Back",
      group: "DEF",
      groupLabel: POSITION_GROUP_LABELS.DEF,
      order: 2,
    };
  }
  if (p.includes("left-back") || p.includes("linke verteidiger") || p === "lb" || p === "lwb") {
    return {
      detailed: "Left-Back",
      group: "DEF",
      groupLabel: POSITION_GROUP_LABELS.DEF,
      order: 2,
    };
  }
  if (p.includes("right-back") || p.includes("rechte verteidiger") || p === "rb" || p === "rwb") {
    return {
      detailed: "Right-Back",
      group: "DEF",
      groupLabel: POSITION_GROUP_LABELS.DEF,
      order: 2,
    };
  }
  if (p.includes("defender") || p.includes("abwehr") || p === "def") {
    return {
      detailed: "Defender",
      group: "DEF",
      groupLabel: POSITION_GROUP_LABELS.DEF,
      order: 2,
    };
  }

  // 3. Midfielders
  if (p.includes("defensive midfield") || p.includes("defensives mittelfeld") || p === "dm" || p === "cdm") {
    return {
      detailed: "Defensive Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }
  if (p.includes("attacking midfield") || p.includes("offensives mittelfeld") || p === "am" || p === "cam") {
    return {
      detailed: "Attacking Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }
  if (p.includes("central midfield") || p.includes("zentrales mittelfeld") || p === "cm") {
    return {
      detailed: "Central Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }
  if (p.includes("left midfield") || p === "lm") {
    return {
      detailed: "Left Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }
  if (p.includes("right midfield") || p === "rm") {
    return {
      detailed: "Right Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }
  if (p.includes("midfield") || p.includes("mittelfeld") || p === "mid") {
    return {
      detailed: "Midfield",
      group: "MID",
      groupLabel: POSITION_GROUP_LABELS.MID,
      order: 3,
    };
  }

  // 4. Forwards / Attackers
  if (p.includes("left winger") || p.includes("linksaußen") || p === "lw") {
    return {
      detailed: "Left Winger",
      group: "ATT",
      groupLabel: POSITION_GROUP_LABELS.ATT,
      order: 4,
    };
  }
  if (p.includes("right winger") || p.includes("rechtsaußen") || p === "rw") {
    return {
      detailed: "Right Winger",
      group: "ATT",
      groupLabel: POSITION_GROUP_LABELS.ATT,
      order: 4,
    };
  }
  if (p.includes("second striker") || p.includes("hängende spitze") || p === "ss") {
    return {
      detailed: "Second Striker",
      group: "ATT",
      groupLabel: POSITION_GROUP_LABELS.ATT,
      order: 4,
    };
  }
  if (
    p.includes("centre-forward") ||
    p.includes("center-forward") ||
    p.includes("mittelstürmer") ||
    p === "cf" ||
    p.includes("striker")
  ) {
    return {
      detailed: "Centre-Forward",
      group: "ATT",
      groupLabel: POSITION_GROUP_LABELS.ATT,
      order: 4,
    };
  }
  if (p.includes("attack") || p.includes("forward") || p.includes("sturm") || p === "att") {
    return {
      detailed: "Forward",
      group: "ATT",
      groupLabel: POSITION_GROUP_LABELS.ATT,
      order: 4,
    };
  }

  // Fallback for unclassified string
  return {
    detailed: rawPosition.trim(),
    group: "MID",
    groupLabel: POSITION_GROUP_LABELS.MID,
    order: 3,
  };
}
