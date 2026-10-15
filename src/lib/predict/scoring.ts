export type PredictionOutcome = "exact" | "outcome" | "wrong";

export interface PredictionScoreResult {
  points: number;
  outcome: PredictionOutcome;
  label: string;
}

/**
 * FotMob-standard score prediction rules:
 * - 3 points: Exact scoreline predicted
 * - 2 points: Correct match outcome (home win, away win, or draw)
 * - 0 points: Incorrect outcome
 */
export function calculatePredictionPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): PredictionScoreResult {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: 3, outcome: "exact", label: "Exact score (+3 pts)" };
  }

  const predictedSign = Math.sign(predictedHome - predictedAway);
  const actualSign = Math.sign(actualHome - actualAway);

  if (predictedSign === actualSign) {
    return { points: 2, outcome: "outcome", label: "Correct outcome (+2 pts)" };
  }

  return { points: 0, outcome: "wrong", label: "Incorrect (0 pts)" };
}
