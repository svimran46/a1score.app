export interface UserPrediction {
  matchId: number | string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  leagueName?: string;
  kickoffTime: string;
  predictedHome: number;
  predictedAway: number;
  actualHome?: number | null;
  actualAway?: number | null;
  points?: number | null;
  outcome?: "exact" | "outcome" | "wrong" | null;
  isFinished?: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "a1score_predictions_v1";

export function loadLocalPredictions(): Record<string, UserPrediction> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalPrediction(prediction: UserPrediction): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadLocalPredictions();
    current[String(prediction.matchId)] = {
      ...prediction,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("[PredictStorage] save error:", e);
  }
}

export function deleteLocalPrediction(matchId: number | string): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadLocalPredictions();
    delete current[String(matchId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("[PredictStorage] delete error:", e);
  }
}
