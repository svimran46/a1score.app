import type { FotmobLeagueGroup, FotmobMatch } from "@/lib/fotmob/client";

export interface TimedMatch {
  match: FotmobMatch;
  leagueName: string;
}

/**
 * Flattens league groups into one list ordered by kick-off (FotMob's "By time"
 * view). Ties keep league order, then the league's own match order.
 */
export function sortMatchesByTime(leagues: FotmobLeagueGroup[]): TimedMatch[] {
  const rows = leagues.flatMap((league) =>
    league.matches.map((match) => ({
      match,
      leagueName: league.ccode ? `${league.ccode.toUpperCase()} - ${league.name}` : league.name,
    }))
  );
  const kickoff = (m: FotmobMatch) => {
    if (Number.isFinite(m.timeTS) && m.timeTS > 0) return m.timeTS;
    const t = Date.parse(m.status?.utcTime ?? "");
    return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
  };
  // Array.prototype.sort is stable, so equal kick-offs keep their input order.
  return rows.sort((a, b) => kickoff(a.match) - kickoff(b.match));
}
