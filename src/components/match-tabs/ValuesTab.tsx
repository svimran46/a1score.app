"use client";

import { MatchFinancialBarometer } from "@/components/MatchFinancialBarometer";

interface ValuesTabProps {
  match: any;
}

export function ValuesTab({ match }: ValuesTabProps) {
  const { teams = {}, status = {}, lineup = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const homeStarters = lineup?.homeTeam?.starters || [];
  const awayStarters = lineup?.awayTeam?.starters || [];

  const homeValuedCount = homeStarters.filter(
    (p: any) => typeof p.marketValue === "number" && p.marketValue > 0
  ).length;
  const awayValuedCount = awayStarters.filter(
    (p: any) => typeof p.marketValue === "number" && p.marketValue > 0
  ).length;

  const homeStarterTotalVal =
    lineup?.homeTeam?.totalStarterMarketValue ||
    homeStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);

  const awayStarterTotalVal =
    lineup?.awayTeam?.totalStarterMarketValue ||
    awayStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);

  return (
    <div className="space-y-6">
      <MatchFinancialBarometer
        homeName={homeTeam?.name || "Home"}
        awayName={awayTeam?.name || "Away"}
        homeScore={homeTeam?.score}
        awayScore={awayTeam?.score}
        homeValue={homeStarterTotalVal}
        awayValue={awayStarterTotalVal}
        homeCoverage={{ valuedCount: homeValuedCount, totalStarters: homeStarters.length || 11 }}
        awayCoverage={{ valuedCount: awayValuedCount, totalStarters: awayStarters.length || 11 }}
        isLive={status?.isLive}
        isFinished={status?.finished}
        isUpcoming={status?.isUpcoming}
      />
    </div>
  );
}
