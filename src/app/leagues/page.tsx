import { getLeagues } from "@/lib/data/leagues";
import { LeaguesDirectoryClient } from "@/components/LeaguesDirectoryClient";
import { Trophy } from "lucide-react";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Top 7 European Football Leagues — Standings & Market Valuations",
  description:
    "Comprehensive financial analytics, club valuations, and league standings across Europe's top 7 domestic competitions: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Liga Portugal, and Eredivisie on a1score.app.",
  path: "/leagues",
});

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3 [text-wrap:balance]">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
          Competitions &amp; Leagues
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 [text-wrap:balance]">
          Comprehensive financial benchmarks, active squad valuations, and domestic standings across Europe&apos;s Top 7 top-flight domestic competitions
        </p>
      </div>

      <LeaguesDirectoryClient initialLeagues={leagues} />
    </div>
  );
}
