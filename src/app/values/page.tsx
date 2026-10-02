import { Suspense } from "react";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { PlayersDirectoryClient } from "@/components/PlayersDirectoryClient";
import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football Market Values — Worldwide Valuations & Movers",
  description:
    "Official player valuations, biggest market value risers & fallers, and financial rankings on a1score.app.",
  path: "/values",
});

export default async function MarketValuesPage() {
  const [players, movers] = await Promise.all([
    getMostValuablePlayers(100).catch(() => []),
    getMarketValueMovers(6).catch(() => ({ risers: [], fallers: [] })),
  ]);

  return (
    <Suspense
      fallback={
        <div className="rounded-[var(--card-radius)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)] text-sm">
          Loading market valuations...
        </div>
      }
    >
      <PlayersDirectoryClient
        initialPlayers={players}
        movers={movers}
        pageTitle="Market Values"
        pageSubtitle="Worldwide player valuation rankings and movers"
      />
    </Suspense>
  );
}
