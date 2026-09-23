import { DateTabs } from "@/components/matches/date-tabs";
import { FixturesBoard } from "@/components/matches/fixtures-board";
import { getFixturesByDate, getLiveFixtures } from "@/lib/api-football/fixtures";
import { toDateKey } from "@/lib/match-status";

interface HomeProps {
  searchParams: Promise<{ date?: string }>;
}

/**
 * Matches (home, Section 8.1). The server renders the selected day's
 * fixtures from the Data Cache; the board hydrates and keeps live rows
 * fresh by polling our own route handler.
 */
export default async function HomePage({ searchParams }: HomeProps) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : toDateKey(new Date());

  const [dateResult, liveResult] = await Promise.all([
    getFixturesByDate(date),
    getLiveFixtures(),
  ]);

  const fixtures = dateResult.ok ? dateResult.data : [];
  const live = liveResult.ok ? liveResult.data : [];
  const serverError = !dateResult.ok;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">Football matches</h1>
      <DateTabs date={date} />
      <FixturesBoard initialFixtures={fixtures} initialLive={live} serverError={serverError} />
    </div>
  );
}
