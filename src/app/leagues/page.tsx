import { getLeagues } from "@/lib/data/leagues";
import { LeaguesDirectoryClient } from "@/components/LeaguesDirectoryClient";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Top 7 European Football Leagues — Standings & Market Valuations",
  description:
    "Club valuations and league standings across Europe's top 7 domestic competitions: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Liga Portugal, and Eredivisie on a1score.app.",
  path: "/leagues",
});

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return <LeaguesDirectoryClient initialLeagues={leagues} />;
}
