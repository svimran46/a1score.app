import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { PlayerCard } from "@/components/PlayerCard";
import { MarketMovers } from "@/components/MarketMovers";
import { Users, TrendingUp } from "lucide-react";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football Players Directory — Market Valuations & Profiles",
  description:
    "Explore global football player directory, market valuations, career profiles, injury reports, and transfer records on a1score.app.",
  path: "/players",
});

export default async function PlayersPage() {
  const [players, movers] = await Promise.all([
    getMostValuablePlayers(40),
    getMarketValueMovers(6).catch(() => ({ risers: [], fallers: [] })),
  ]);

  return (
    <div className="space-y-6 sm:space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3 [text-wrap:balance]">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
          Players Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 [text-wrap:balance]">
          Top market valuations, career trajectories, and valuation shifts in global football
        </p>
      </div>

      {/* Market Value Movers (Risers & Fallers) */}
      {movers && (movers.risers.length > 0 || movers.fallers.length > 0) && (
        <section>
          <MarketMovers risers={movers.risers} fallers={movers.fallers} />
        </section>
      )}

      {/* Complete Rankings Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Top 40 Worldwide Valuations
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {players.length} players ranked
          </span>
        </div>

        {players.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
            No player records synced yet. Run <code className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code>.
          </div>
        )}
      </section>
    </div>
  );
}
