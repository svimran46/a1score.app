"use client";

import { useState, useEffect } from "react";
import { Award, CheckCircle, Clock, Info, Shield, Trophy } from "lucide-react";
import {
  UserPrediction,
  loadLocalPredictions,
  saveLocalPrediction,
} from "@/lib/predict/storage";
import { calculatePredictionPoints } from "@/lib/predict/scoring";

interface FixtureItem {
  id: number;
  league: string;
  home: string;
  away: string;
  homeCrest?: string;
  awayCrest?: string;
  time: string;
  status: "upcoming" | "finished";
  actualHome?: number;
  actualAway?: number;
}

// Sample marquee fixtures for immediate play
const SAMPLE_FIXTURES: FixtureItem[] = [
  {
    id: 101,
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    time: "Saturday 17:30",
    status: "upcoming",
  },
  {
    id: 102,
    league: "Premier League",
    home: "Liverpool",
    away: "Manchester City",
    time: "Sunday 16:30",
    status: "upcoming",
  },
  {
    id: 103,
    league: "LaLiga",
    home: "Real Madrid",
    away: "Barcelona",
    time: "Sunday 20:00",
    status: "upcoming",
  },
  {
    id: 104,
    league: "Serie A",
    home: "Inter Milan",
    away: "Juventus",
    time: "Saturday 19:45",
    status: "upcoming",
  },
  {
    id: 105,
    league: "Bundesliga",
    home: "Bayern Munich",
    away: "Borussia Dortmund",
    time: "Saturday 17:30",
    status: "finished",
    actualHome: 3,
    actualAway: 1,
  },
];

export function PredictClient() {
  const [activeTab, setActiveTab] = useState<"fixtures" | "history" | "rules">("fixtures");
  const [predictions, setPredictions] = useState<Record<string, UserPrediction>>({});
  const [scores, setScores] = useState<Record<number, { home: number; away: number }>>({
    101: { home: 2, away: 1 },
    102: { home: 1, away: 1 },
    103: { home: 2, away: 2 },
    104: { home: 1, away: 0 },
    105: { home: 2, away: 1 },
  });
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loaded = loadLocalPredictions();
    setPredictions(loaded);
    // Initialize scores from loaded predictions if present
    setScores((prev) => {
      const next = { ...prev };
      Object.entries(loaded).forEach(([id, pred]) => {
        const numId = Number(id);
        if (!isNaN(numId)) {
          next[numId] = { home: pred.predictedHome, away: pred.predictedAway };
        }
      });
      return next;
    });
  }, []);

  const handleScoreChange = (fixtureId: number, team: "home" | "away", delta: number) => {
    setScores((prev) => {
      const current = prev[fixtureId] || { home: 0, away: 0 };
      const nextVal = Math.max(0, Math.min(15, current[team] + delta));
      return {
        ...prev,
        [fixtureId]: {
          ...current,
          [team]: nextVal,
        },
      };
    });
    setSavedStatus((prev) => ({ ...prev, [fixtureId]: false }));
  };

  const handleSave = (fixture: FixtureItem) => {
    const score = scores[fixture.id] || { home: 0, away: 0 };
    let points: number | null = null;
    let outcome: "exact" | "outcome" | "wrong" | null = null;

    if (fixture.status === "finished" && fixture.actualHome !== undefined && fixture.actualAway !== undefined) {
      const calc = calculatePredictionPoints(score.home, score.away, fixture.actualHome, fixture.actualAway);
      points = calc.points;
      outcome = calc.outcome;
    }

    const newPred: UserPrediction = {
      matchId: fixture.id,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      leagueName: fixture.league,
      kickoffTime: fixture.time,
      predictedHome: score.home,
      predictedAway: score.away,
      actualHome: fixture.actualHome ?? null,
      actualAway: fixture.actualAway ?? null,
      points,
      outcome,
      isFinished: fixture.status === "finished",
      updatedAt: new Date().toISOString(),
    };

    saveLocalPrediction(newPred);
    setPredictions((prev) => ({ ...prev, [String(fixture.id)]: newPred }));
    setSavedStatus((prev) => ({ ...prev, [fixture.id]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [fixture.id]: false }));
    }, 2500);
  };

  // Metrics
  const predictionList = Object.values(predictions);
  const totalPoints = predictionList.reduce((acc, p) => acc + (p.points || 0), 0);
  const finishedCount = predictionList.filter((p) => p.isFinished).length;
  const correctCount = predictionList.filter((p) => (p.points || 0) > 0).length;
  const accuracy = finishedCount > 0 ? Math.round((correctCount / finishedCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-card border border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bg-elevated text-trend-up mb-2">
            <Trophy className="w-3.5 h-3.5" /> Phase 6b Predictor
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Match Predictor</h1>
          <p className="text-sm text-text-secondary mt-1">
            Predict outcomes and exact scorelines. Earn 2 pts for correct outcome and 3 pts for an exact score.
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-center min-w-[85px]">
            <div className="text-xl font-bold text-trend-up">{totalPoints}</div>
            <div className="text-[11px] font-medium text-text-muted">Total Points</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-center min-w-[85px]">
            <div className="text-xl font-bold text-text-primary">{predictionList.length}</div>
            <div className="text-[11px] font-medium text-text-muted">Predictions</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-center min-w-[85px]">
            <div className="text-xl font-bold text-text-primary">{accuracy}%</div>
            <div className="text-[11px] font-medium text-text-muted">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          onClick={() => setActiveTab("fixtures")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "fixtures"
              ? "bg-bg-elevated text-trend-up font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Upcoming Fixtures
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "history"
              ? "bg-bg-elevated text-trend-up font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          My Predictions ({predictionList.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "rules"
              ? "bg-bg-elevated text-trend-up font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Scoring Rules
        </button>
      </div>

      {/* Tab: Fixtures */}
      {activeTab === "fixtures" && (
        <div className="space-y-4">
          {SAMPLE_FIXTURES.map((fixture) => {
            const currentScore = scores[fixture.id] || { home: 0, away: 0 };
            const isSaved = savedStatus[fixture.id];
            const existing = predictions[String(fixture.id)];

            return (
              <div
                key={fixture.id}
                className="p-4 rounded-xl bg-bg-card border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-border-hover"
              >
                {/* Match Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-text-muted">
                    <span>{fixture.league}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fixture.time}
                    </span>
                  </div>
                  <div className="mt-2 text-base font-semibold text-text-primary">
                    <span>{fixture.home}</span>
                    <span className="text-text-muted px-2">vs</span>
                    <span>{fixture.away}</span>
                  </div>
                  {fixture.status === "finished" && (
                    <div className="mt-1 text-xs text-trend-up font-medium">
                      Full Time Result: {fixture.actualHome} - {fixture.actualAway}
                    </div>
                  )}
                </div>

                {/* Score Steppers */}
                <div className="flex items-center gap-3">
                  {/* Home Stepper */}
                  <div className="flex items-center gap-1.5 bg-bg-elevated border border-border-subtle rounded-lg p-1">
                    <button
                      onClick={() => handleScoreChange(fixture.id, "home", -1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-base text-text-primary">
                      {currentScore.home}
                    </span>
                    <button
                      onClick={() => handleScoreChange(fixture.id, "home", 1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-text-muted font-bold">:</span>

                  {/* Away Stepper */}
                  <div className="flex items-center gap-1.5 bg-bg-elevated border border-border-subtle rounded-lg p-1">
                    <button
                      onClick={() => handleScoreChange(fixture.id, "away", -1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-base text-text-primary">
                      {currentScore.away}
                    </span>
                    <button
                      onClick={() => handleScoreChange(fixture.id, "away", 1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded"
                    >
                      +
                    </button>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(fixture)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                      isSaved
                        ? "bg-trend-up text-accent-contrast"
                        : existing
                        ? "bg-bg-elevated text-trend-up border border-border-subtle"
                        : "bg-accent text-accent-contrast hover:opacity-90 font-bold"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Saved
                      </>
                    ) : existing ? (
                      "Update"
                    ) : (
                      "Predict"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {predictionList.length === 0 ? (
            <div className="text-center py-12 text-text-secondary bg-bg-card rounded-xl border border-border-subtle">
              <Shield className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-50" />
              <p className="font-semibold text-text-primary">No predictions saved yet</p>
              <p className="text-xs text-text-muted mt-1">Submit your first match prediction above.</p>
            </div>
          ) : (
            predictionList.map((p) => (
              <div
                key={p.matchId}
                className="p-3.5 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-text-muted">{p.leagueName || "League Fixture"}</div>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">
                    {p.homeTeam} vs {p.awayTeam}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-text-muted">Prediction</div>
                    <div className="text-base font-bold text-text-primary">
                      {p.predictedHome} - {p.predictedAway}
                    </div>
                  </div>
                  {p.points !== null && p.points !== undefined && (
                    <div
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        p.points === 3
                          ? "bg-bg-elevated text-trend-up border border-border-subtle"
                          : p.points === 2
                          ? "bg-bg-elevated text-info border border-border-subtle"
                          : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {p.points > 0 ? `+${p.points} pts` : "0 pts"}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === "rules" && (
        <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-trend-up mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Exact Scoreline: 3 Points</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Predict the exact final score of the match (e.g. Predicted 2-1 and match ends 2-1).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-info mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Match Outcome: 2 Points</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Correctly predict the winner or a draw, even if the exact scoreline differs (e.g. Predicted 3-0 and match ends 2-1).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Incorrect: 0 Points</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                No points are awarded if the outcome does not match.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
