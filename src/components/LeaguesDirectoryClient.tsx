"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { EntityImage } from "./EntityImage";
import { PageHeader } from "./PageHeader";
import { formatCompactEur } from "@/lib/utils";
import { EUR_CONTEXT, type MoneyContext } from "@/lib/currency";
import { useMoney } from "@/lib/useMoney";
import { getLeagueSlug } from "@/lib/slugs";
import { Card, Chip } from "@/components/ui";
import { FollowButton } from "@/components/watchlist/FollowButton";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import { matchesLeagueQuery } from "@/lib/leagues/search";

export interface LeagueListItem {
  id: string;
  name: string;
  country: string;
  tier: number;
  logoUrl?: string | null;
  clubCount: number;
  totalPlayers: number;
  totalMarketValue: number;
  avgSquadValue: number;
}

interface LeaguesDirectoryClientProps {
  initialLeagues: LeagueListItem[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
};

export function formatDetailedLeagueValue(eur: number, ctx: MoneyContext = EUR_CONTEXT): string {
  if (!eur || eur === 0) return "N/A";
  const value = eur * ctx.rate;
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${ctx.symbol}${b.toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${ctx.symbol}${m.toFixed(1)}M`;
  }
  return formatCompactEur(eur, ctx);
}

const SORT_OPTIONS = [
  { label: "Highest Value", val: "val_desc" as const },
  { label: "Lowest Value", val: "val_asc" as const },
  { label: "Avg per Club", val: "avg_desc" as const },
  { label: "Name (A–Z)", val: "name_asc" as const },
];

function LeagueCrest({ league, size }: { league: LeagueListItem; size: number }) {
  const flag = COUNTRY_FLAGS[league.country] || "🌐";
  return (
    <div
      className="relative rounded-xl bg-[var(--bg-page)] p-1 flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {league.logoUrl ? (
        <EntityImage src={league.logoUrl} alt="" fill sizes={`${size}px`} entityType="league" className="object-contain p-0.5" />
      ) : (
        <span className="text-xl">{flag}</span>
      )}
    </div>
  );
}

function FollowedLeagues({ leagues }: { leagues: LeagueListItem[] }) {
  const { isMounted, leagueFavorites, unfollow } = useWatchlist();
  const [editing, setEditing] = useState(false);

  if (!isMounted) return null;

  // Prefer fresh directory data; fall back to what was saved when followed.
  const byId = new Map(leagues.map((l) => [l.id, l]));
  const followed = leagueFavorites.map((f) => ({ fav: f, league: byId.get(f.id) }));

  return (
    <section aria-label="Followed leagues" className="bg-[var(--bg-card)] rounded-[var(--card-radius)] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Following</h2>
        {followed.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
            className="min-h-[44px] px-2 text-sm font-semibold text-[var(--accent)] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      {followed.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--text-muted)]">
          Tap the star next to a league below to keep it at the top.
        </p>
      ) : (
        <ul className="pb-2">
          {followed.map(({ fav, league }) => (
            <li key={fav.id} className="flex items-center">
              <Link
                href={league ? `/leagues/${getLeagueSlug(league)}` : `/leagues/${fav.slug || fav.id}`}
                className="flex-1 min-w-0 flex items-center gap-4 min-h-[56px] px-4 py-2 hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
              >
                {league ? (
                  <LeagueCrest league={league} size={32} />
                ) : (
                  <span className="w-8 h-8 rounded-xl bg-[var(--bg-chip)] shrink-0" />
                )}
                <span className="text-[15px] font-medium text-[var(--text-primary)] truncate">{league?.name ?? fav.name}</span>
              </Link>
              {editing && (
                <button
                  type="button"
                  onClick={() => unfollow(fav.id, "league")}
                  aria-label={`Unfollow ${fav.name}`}
                  className="mr-2 w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--trend-down)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <X aria-hidden="true" className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LeaguesDirectoryClient({ initialLeagues }: LeaguesDirectoryClientProps) {
  const money = useMoney();
  const [sortOption, setSortOption] = useState<"val_desc" | "val_asc" | "avg_desc" | "name_asc">("val_desc");
  const [query, setQuery] = useState("");

  const sortedLeagues = useMemo(() => {
    return initialLeagues.filter((l) => matchesLeagueQuery(l, query)).sort((a, b) => {
      if (sortOption === "val_desc") return b.totalMarketValue - a.totalMarketValue;
      if (sortOption === "val_asc") return a.totalMarketValue - b.totalMarketValue;
      if (sortOption === "avg_desc") return b.avgSquadValue - a.avgSquadValue;
      if (sortOption === "name_asc") return a.name.localeCompare(b.name);
      return b.totalMarketValue - a.totalMarketValue;
    });
  }, [initialLeagues, sortOption, query]);

  return (
    <div className="space-y-4 max-w-[720px] mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Leagues"
        subtitle="Europe's top competitions ranked by total market valuation"
      />

      {/* Find leagues */}
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find leagues"
          aria-label="Find leagues"
          className="w-full min-h-[52px] pl-12 pr-4 rounded-[var(--card-radius)] bg-[var(--bg-card)] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        />
      </div>

      {!query && <FollowedLeagues leagues={initialLeagues} />}

      <h2 className="px-1 pt-2 text-lg font-bold text-[var(--text-primary)]">All competitions</h2>

      {/* 2. Quick Sort Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.val}
            active={sortOption === opt.val}
            onClick={() => setSortOption(opt.val)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>

      {/* 3. Leagues List in Card */}
      <Card className="p-1 overflow-hidden">
        {/* Sticky Desktop List Header */}
        <div className="sticky top-[var(--nav-height)] z-20 bg-bg-card/95 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--divider)]">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center">#</span>
            <span>League & Country</span>
          </div>
          <span>Total Market Value</span>
        </div>

        <div className="divide-y divide-[var(--divider)]">
          {sortedLeagues.map((league, idx) => {
            const flag = COUNTRY_FLAGS[league.country] || "🌐";
            const slug = getLeagueSlug(league);
            return (
              <div
                key={league.id}
                className="group relative flex items-center justify-between gap-3 min-h-[64px] px-3 sm:px-4 py-2 hover:bg-[var(--bg-hover)] transition-colors rounded-xl"
              >
                {/* Whole-row link sits underneath so the follow star can be its own button */}
                <Link
                  href={`/leagues/${slug}`}
                  aria-label={league.name}
                  className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />
                {/* Left: Rank + Crest + Name & Metadata */}
                <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10 pointer-events-none">
                  <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
                    {idx + 1}
                  </span>

                  <div className="relative w-10 h-10 rounded-xl bg-[var(--bg-page)] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {league.logoUrl ? (
                      <EntityImage
                        src={league.logoUrl}
                        alt=""
                        fill
                        sizes="40px"
                        entityType="league"
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-xl">{flag}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                      {league.name}
                    </h3>
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 truncate">
                      <span>{flag}</span>
                      <span>{league.country}</span>
                      <span>•</span>
                      <span>{league.clubCount} clubs</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline tabular-nums">{league.totalPlayers} players</span>
                    </div>
                  </div>
                </div>

                {/* Right: Valuations + follow */}
                <div className="text-right shrink-0 relative z-10 pointer-events-none">
                  <span className="text-sm sm:text-base font-bold text-[var(--value-text)] figure tabular-nums block">
                    {formatDetailedLeagueValue(league.totalMarketValue, money.ctx)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] tabular-nums block font-medium">
                    avg {money.compact(league.avgSquadValue)}
                  </span>
                </div>
                <FollowButton
                  id={league.id}
                  type="league"
                  name={league.name}
                  slug={slug}
                  avatarUrl={league.logoUrl}
                  className="relative z-10 -mr-2"
                />
              </div>
            );
          })}
          {sortedLeagues.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No leagues match “{query}”.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
