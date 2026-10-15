import type { Metadata } from "next";
import { PredictClient } from "@/components/predict/PredictClient";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Match Predictor — a1score",
  description: "Predict football match scores, earn points for correct outcomes, and climb the leaderboard.",
};

export default function PredictPage() {
  return <PredictClient />;
}
