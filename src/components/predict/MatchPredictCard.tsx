"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Check, ArrowRight, Minus, Plus, Sparkles } from "lucide-react";
import {
  loadLocalPredictions,
  saveLocalPrediction,
  UserPrediction,
} from "@/lib/predict/storage";
import { calculatePredictionPoints } from "@/lib/predict/scoring";

interface MatchPredictCardProps {
  match: any;
}

export function MatchPredictCard({ match }: MatchPredictCardProps) {
  const { general = {}, teams = {}, status = {} } = match || {};
  const matchId = general?.matchId || match?.id;
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const isStarted = Boolean(status?.started || status?.isLive);
  const isFinished = Boolean(status?.finished);
  const actualHome = homeTeam?.score;
  const actualAway = awayTeam?.score;

  const [prediction, setPrediction] = useState<UserPrediction | null>(null);
  const [homeScore, setHomeScore] = useState<number>(1);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!matchId) return;
    const all = loadLocalPredictions();
    const existing = all[String(matchId)];
    if (existing) {
      setPrediction(existing);
      setHomeScore(existing.predictedHome);
      setAwayScore(existing.predictedAway);
      setIsSaved(true);
    }
  }, [matchId]);

  if (!matchId) return null;

  const handleScoreChange = (team: "home" | "away", delta: number) => {
    if (isStarted && !prediction) return;
    setIsSaved(false);
    if (team === "home") {
      setHomeScore((prev) => Math.max(0, Math.min(15, prev + delta)));
    } else {
      setAwayScore((prev) => Math.max(0, Math.min(15, prev + delta)));
    }
  };

  const handleSave = () => {
    let points: number | null = null;
    let outcome: "exact" | "outcome" | "wrong" | null = null;

    if (isFinished && actualHome !== undefined && actualAway !== undefined) {
      const calc = calculatePredictionPoints(homeScore, awayScore, actualHome, actualAway);
      points = calc.points;
      outcome = calc.outcome;
    }

    const newPred: UserPrediction = {
      matchId,
      homeTeam: homeTeam?.name || "Home",
      awayTeam: awayTeam?.name || "Away",
      leagueName: general?.leagueName || general?.parentLeagueName,
      kickoffTime: general?.matchTimeUTCDate || general?.matchTimeUTC || new Date().toISOString(),
      predictedHome: homeScore,
      predictedAway: awayScore,
      actualHome: isFinished ? actualHome : null,
      actualAway: isFinished ? actualAway : null,
      points,
      outcome,
      isFinished,
      updatedAt: new Date().toISOString(),
    };

    saveLocalPrediction(newPred);
    setPrediction(newPred);
    setIsSaved(true);
  };

  // Outcome points calculation if finished
  const pointsBadge = () => {
    if (!prediction || !isFinished || actualHome === undefined || actualAway === undefined) {
      return null;
    }
    const { points, outcome } = calculatePredictionPoints(
      prediction.predictedHome,
      prediction.predictedAway,
      actualHome,
      actualAway
    );

    if (outcome === "exact") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-trend-up text-accent-contrast">
          <Sparkles className="w-3.5 h-3.5" /> +{points} pts (Exact Score!)
        </span>
      );
    }
    if (outcome === "outcome") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-accent text-accent-contrast">
          +{points} pt (Correct Result)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-bg-chip text-text-muted">
        0 pts (Incorrect)
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-divider">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" />
          <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wider">
            Match Predictor
          </h3>
        </div>
        {pointsBadge() || (
          <Link
            href="/predict"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Leaderboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Main Prediction Box */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <span className="text-sm font-semibold text-text-primary truncate max-w-[140px] sm:max-w-[180px]">
            {homeTeam?.name || "Home"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isStarted}
              onClick={() => handleScoreChange("home", -1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-chip text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease home score"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-lg font-bold text-text-primary tabular-nums">
              {homeScore}
            </span>
            <button
              type="button"
              disabled={isStarted}
              onClick={() => handleScoreChange("home", 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-chip text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase home score"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Separator / Status */}
        <div className="text-xs font-bold text-text-muted uppercase tracking-widest px-2">
          vs
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 order-2 sm:order-1">
            <button
              type="button"
              disabled={isStarted}
              onClick={() => handleScoreChange("away", -1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-chip text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease away score"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-lg font-bold text-text-primary tabular-nums">
              {awayScore}
            </span>
            <button
              type="button"
              disabled={isStarted}
              onClick={() => handleScoreChange("away", 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-chip text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase away score"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm font-semibold text-text-primary truncate max-w-[140px] sm:max-w-[180px] order-1 sm:order-2 text-right">
            {awayTeam?.name || "Away"}
          </span>
        </div>
      </div>

      {/* Action and Hint Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-divider">
        <p className="text-[11px] text-text-muted text-center sm:text-left">
          {isStarted
            ? "Predictions locked once match kicks off."
            : "Exact score = 3 pts • Correct outcome = 2 pts"}
        </p>

        {!isStarted && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSaved
                ? "bg-bg-chip text-trend-up cursor-default"
                : "bg-accent text-accent-contrast hover:opacity-90 cursor-pointer shadow-xs"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Prediction Locked
              </>
            ) : (
              "Save Prediction"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
