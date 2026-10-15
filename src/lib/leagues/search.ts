/** Case- and accent-insensitive match on league name or country ("Find leagues"). */
export function matchesLeagueQuery(league: { name: string; country?: string | null }, query: string): boolean {
  const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = norm(query.trim());
  if (!q) return true;
  return norm(league.name).includes(q) || norm(league.country || "").includes(q);
}
