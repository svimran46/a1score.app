export type FormationKey = "4-3-3" | "4-2-3-1" | "3-5-2" | "4-4-2" | "5-3-2";

export interface LineupSlot {
  id: string;
  position: string;
  role: "GK" | "DEF" | "MID" | "ATT";
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  playerId?: string | number;
  playerName?: string;
  clubName?: string;
  marketValueEur?: number;
  age?: number;
  imageUrl?: string;
}

export interface FormationConfig {
  key: FormationKey;
  label: string;
  slots: LineupSlot[];
}

export const FORMATIONS: Record<FormationKey, FormationConfig> = {
  "4-3-3": {
    key: "4-3-3",
    label: "4-3-3 Attack",
    slots: [
      { id: "gk", position: "GK", role: "GK", x: 50, y: 88 },
      { id: "lb", position: "LB", role: "DEF", x: 16, y: 70 },
      { id: "lcb", position: "CB", role: "DEF", x: 38, y: 72 },
      { id: "rcb", position: "CB", role: "DEF", x: 62, y: 72 },
      { id: "rb", position: "RB", role: "DEF", x: 84, y: 70 },
      { id: "lcm", position: "CM", role: "MID", x: 28, y: 46 },
      { id: "cm", position: "CM", role: "MID", x: 50, y: 52 },
      { id: "rcm", position: "CM", role: "MID", x: 72, y: 46 },
      { id: "lw", position: "LW", role: "ATT", x: 20, y: 22 },
      { id: "st", position: "ST", role: "ATT", x: 50, y: 16 },
      { id: "rw", position: "RW", role: "ATT", x: 80, y: 22 },
    ],
  },
  "4-2-3-1": {
    key: "4-2-3-1",
    label: "4-2-3-1 Modern",
    slots: [
      { id: "gk", position: "GK", role: "GK", x: 50, y: 88 },
      { id: "lb", position: "LB", role: "DEF", x: 16, y: 72 },
      { id: "lcb", position: "CB", role: "DEF", x: 38, y: 74 },
      { id: "rcb", position: "CB", role: "DEF", x: 62, y: 74 },
      { id: "rb", position: "RB", role: "DEF", x: 84, y: 72 },
      { id: "ldm", position: "CDM", role: "MID", x: 35, y: 56 },
      { id: "rdm", position: "CDM", role: "MID", x: 65, y: 56 },
      { id: "cam", position: "CAM", role: "MID", x: 50, y: 38 },
      { id: "lm", position: "LM", role: "ATT", x: 18, y: 32 },
      { id: "rm", position: "RM", role: "ATT", x: 82, y: 32 },
      { id: "st", position: "ST", role: "ATT", x: 50, y: 16 },
    ],
  },
  "3-5-2": {
    key: "3-5-2",
    label: "3-5-2 Wingbacks",
    slots: [
      { id: "gk", position: "GK", role: "GK", x: 50, y: 88 },
      { id: "lcb", position: "CB", role: "DEF", x: 28, y: 74 },
      { id: "cb", position: "CB", role: "DEF", x: 50, y: 76 },
      { id: "rcb", position: "CB", role: "DEF", x: 72, y: 74 },
      { id: "lwb", position: "LWB", role: "MID", x: 12, y: 48 },
      { id: "lcm", position: "CM", role: "MID", x: 34, y: 52 },
      { id: "cm", position: "CM", role: "MID", x: 50, y: 44 },
      { id: "rcm", position: "CM", role: "MID", x: 66, y: 52 },
      { id: "rwb", position: "RWB", role: "MID", x: 88, y: 48 },
      { id: "lst", position: "ST", role: "ATT", x: 36, y: 18 },
      { id: "rst", position: "ST", role: "ATT", x: 64, y: 18 },
    ],
  },
  "4-4-2": {
    key: "4-4-2",
    label: "4-4-2 Classic",
    slots: [
      { id: "gk", position: "GK", role: "GK", x: 50, y: 88 },
      { id: "lb", position: "LB", role: "DEF", x: 16, y: 72 },
      { id: "lcb", position: "CB", role: "DEF", x: 38, y: 74 },
      { id: "rcb", position: "CB", role: "DEF", x: 62, y: 74 },
      { id: "rb", position: "RB", role: "DEF", x: 84, y: 72 },
      { id: "lm", position: "LM", role: "MID", x: 18, y: 48 },
      { id: "lcm", position: "CM", role: "MID", x: 38, y: 50 },
      { id: "rcm", position: "CM", role: "MID", x: 62, y: 50 },
      { id: "rm", position: "RM", role: "MID", x: 82, y: 48 },
      { id: "lst", position: "ST", role: "ATT", x: 38, y: 18 },
      { id: "rst", position: "ST", role: "ATT", x: 62, y: 18 },
    ],
  },
  "5-3-2": {
    key: "5-3-2",
    label: "5-3-2 Compact",
    slots: [
      { id: "gk", position: "GK", role: "GK", x: 50, y: 88 },
      { id: "lwb", position: "LWB", role: "DEF", x: 12, y: 64 },
      { id: "lcb", position: "CB", role: "DEF", x: 32, y: 75 },
      { id: "cb", position: "CB", role: "DEF", x: 50, y: 78 },
      { id: "rcb", position: "CB", role: "DEF", x: 68, y: 75 },
      { id: "rwb", position: "RWB", role: "DEF", x: 88, y: 64 },
      { id: "lcm", position: "CM", role: "MID", x: 30, y: 46 },
      { id: "cm", position: "CM", role: "MID", x: 50, y: 48 },
      { id: "rcm", position: "CM", role: "MID", x: 70, y: 46 },
      { id: "lst", position: "ST", role: "ATT", x: 38, y: 18 },
      { id: "rst", position: "ST", role: "ATT", x: 62, y: 18 },
    ],
  },
};

export function calculateLineupMetrics(slots: LineupSlot[]) {
  const filled = slots.filter((s) => s.marketValueEur !== undefined && s.marketValueEur > 0);
  const totalValue = filled.reduce((acc, s) => acc + (s.marketValueEur || 0), 0);
  const filledAges = slots.filter((s) => s.age !== undefined && s.age > 0);
  const avgAge =
    filledAges.length > 0
      ? Math.round((filledAges.reduce((acc, s) => acc + (s.age || 0), 0) / filledAges.length) * 10) / 10
      : null;

  return {
    totalValueEur: totalValue,
    filledCount: filled.length,
    averageAge: avgAge,
  };
}
