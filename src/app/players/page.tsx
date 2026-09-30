import { Suspense } from "react";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { MarketMovers } from "@/components/MarketMovers";
import { PlayersDirectoryClient } from "@/components/PlayersDirectoryClient";
import { Users } from "lucide-react";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football Players Directory — Top Market Valuations & Leaderboard",
  description:
    "Explore worldwide football player market valuations, career positions, age demographics, and valuation movements on a1score.app.",
  path: "/players",
});

export default async function PlayersPage() {
  const [players, movers] = await Promise.all([
    getMostValuablePlayers(100),
    getMarketValueMovers(6).catch(() => ({ risers: [], fallers: [] })),
  ]);

  return (
    <div className="space-y-6 sm:space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3 [text-wrap:balance]">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
          Players Directory & Valuations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 [text-wrap:balance]">
          Top market valuations, career demographics, and valuation shifts in global football
        </p>
      </div>

      {/* Market Value Movers (Risers & Fallers) */}
      {movers && (movers.risers.length > 0 || movers.fallers.length > 0) && (
        <section>
          <MarketMovers risers={movers.risers} fallers={movers.fallers} />
        </section>
      )}

      {/* Interactive Players Directory with Search, Filters, Sorting, and Pagination */}
      <Suspense
        fallback={
          <div className="rounded-3xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
            Loading player valuations...
          </div>
        }
      >
        <PlayersDirectoryClient initialPlayers={players} />
      </Suspense>
    </div>
  );
}
