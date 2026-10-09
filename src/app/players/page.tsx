import { Suspense } from "react";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { PlayersDirectoryClient } from "@/components/PlayersDirectoryClient";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Players — Top market valuations worldwide",
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
    <Suspense
      fallback={
        <div className="rounded-3xl glass-panel p-12 border border-divider text-center text-text-muted text-sm">
          Loading player valuations...
        </div>
      }
    >
      <PlayersDirectoryClient initialPlayers={players} movers={movers} />
    </Suspense>
  );
}
