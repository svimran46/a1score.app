import type { Metadata } from "next";
import { LineupBuilderClient } from "@/components/lineup/LineupBuilderClient";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Lineup Builder — a1score",
  description: "Build your dream XI, configure tactical formations, and calculate total combined squad market values.",
};

export default function LineupBuilderPage() {
  return <LineupBuilderClient />;
}
