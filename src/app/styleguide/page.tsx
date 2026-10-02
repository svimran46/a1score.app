"use client";

import React, { useState } from "react";
import {
  Card,
  Chip,
  SectionHeader,
  MatchRow,
  PlayerRow,
  ClubRow,
  TransferRow,
  Tabs,
  Skeleton,
  CardSkeleton,
  MatchRowSkeleton,
  PlayerRowSkeleton,
  ClubRowSkeleton,
  TransferRowSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles, Trophy, Users, Shield, TrendingUp, ArrowLeftRight } from "lucide-react";

export default function StyleguidePage() {
  const [activeChip, setActiveChip] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);

  const sampleTabs = [
    { id: "overview", label: "Overview" },
    { id: "squad", label: "Squad", count: 24 },
    { id: "transfers", label: "Transfers", count: 8 },
    { id: "value", label: "Value History" },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--divider)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--accent)] text-[var(--accent-contrast)]">
              Phase 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Design System & Component Styleguide
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Living catalog of FotMob-style shared components across all states (default, hover, focus, active, loading, empty).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Theme:</span>
          <ThemeToggle />
        </div>
      </div>

      {/* 1. CARD COMPONENT */}
      <section className="space-y-4">
        <SectionHeader title="1. Card Surface" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Tokens: <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">bg-card</code>, radius <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">--card-radius (20px)</code>, padding <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">--card-padding (20px)</code>, no borders, no dark mode shadow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Standard Surface Card</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Separated by tone rather than rigid borders. Seamless background transitions with high contrast typography.
            </p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Metric Card</span>
              <span className="text-xs font-semibold text-[var(--accent)]">Live Update</span>
            </div>
            <div className="text-2xl font-black text-[var(--value-text)] tabular-nums">€1.42B</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Total Squad Valuation</p>
          </Card>
        </div>
      </section>

      {/* 2. CHIP (FILTERS & TABS) */}
      <section className="space-y-4">
        <SectionHeader title="2. Chip (Filters and Selectors)" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Height 40px (44px tap target on touch), pill radius, <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">bg-chip</code>, text-sm, weight 600. Active state uses <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">accent</code> with <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">accent-contrast</code> text.
        </p>

        <Card className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Interactive State Demo</div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Chip
              active={activeChip === "all"}
              onClick={() => setActiveChip("all")}
              icon={<Sparkles className="w-4 h-4" />}
            >
              All Competitions
            </Chip>
            <Chip
              active={activeChip === "ucl"}
              onClick={() => setActiveChip("ucl")}
              icon={<Trophy className="w-4 h-4" />}
            >
              Champions League
            </Chip>
            <Chip
              active={activeChip === "epl"}
              onClick={() => setActiveChip("epl")}
            >
              Premier League
            </Chip>
            <Chip
              active={activeChip === "laliga"}
              onClick={() => setActiveChip("laliga")}
            >
              LaLiga
            </Chip>
            <Chip
              active={activeChip === "seriea"}
              onClick={() => setActiveChip("seriea")}
            >
              Serie A
            </Chip>
          </div>

          <div className="pt-2 border-t border-[var(--divider)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Static States Matrix</div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">Default State</span>
                <Chip>Default Chip</Chip>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">Active State</span>
                <Chip active>Active Chip</Chip>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block">With Icon</span>
                <Chip icon={<TrendingUp className="w-4 h-4" />}>Trending</Chip>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. SECTION HEADER */}
      <section className="space-y-4">
        <SectionHeader title="3. Section Header" />
        <Card className="space-y-4">
          <SectionHeader
            title="Recent Fixtures"
            href="/matches"
            actionLabel="All matches"
          />
          <div className="p-3 rounded-xl bg-[var(--bg-chip)] text-xs text-[var(--text-muted)] text-center">
            [Section Content Container]
          </div>

          <div className="pt-3 border-t border-[var(--divider)]">
            <SectionHeader
              title="Top Valued Players"
              href="/values"
              actionLabel="View ranking"
              count={50}
            />
            <div className="p-3 rounded-xl bg-[var(--bg-chip)] text-xs text-[var(--text-muted)] text-center">
              [Section Content Container with Count Badge]
            </div>
          </div>
        </Card>
      </section>

      {/* 4. MATCH ROW */}
      <section className="space-y-4">
        <SectionHeader title="4. Match Row (Compact, Centered)" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Layout: <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">home name (right-aligned) | crest | time or score | crest | away name (left-aligned)</code>. Live minute in <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">--live</code> with explicit &quot;LIVE&quot; text label. Full row is keyboard accessible.
        </p>

        <Card className="space-y-1">
          {/* Live match */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 px-3">
            Live State (minute + LIVE badge)
          </div>
          <MatchRow
            homeName="Arsenal"
            awayName="Chelsea"
            homeScore={2}
            awayScore={1}
            isLive
            liveMinute={74}
          />

          {/* Finished match */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-3 mb-1 px-3">
            Finished State (FT)
          </div>
          <MatchRow
            homeName="Real Madrid"
            awayName="Barcelona"
            homeScore={3}
            awayScore={2}
            isFinished
            statusText="FT"
          />

          {/* Upcoming match */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-3 mb-1 px-3">
            Upcoming State (Kickoff Time)
          </div>
          <MatchRow
            homeName="Bayern Munich"
            awayName="Borussia Dortmund"
            kickoffTime="20:00"
            statusText="Today"
          />
        </Card>
      </section>

      {/* 5. PLAYER ROW */}
      <section className="space-y-4">
        <SectionHeader title="5. Player Row (Valuation-First)" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Fixed height <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">--row-height (64px)</code>. Rank (24px, muted), 40px round avatar, name over club crest + club (muted, text-sm), amber tabular value (700) with trend arrow and percentage.
        </p>

        <Card className="space-y-1">
          <PlayerRow
            rank={1}
            name="Erling Haaland"
            clubName="Manchester City"
            position="Centre-Forward"
            age={24}
            nationality="Norway"
            marketValue={200000000}
            trendDiff={20000000}
            trendPercentage={11.1}
          />
          <PlayerRow
            rank={2}
            name="Lamine Yamal"
            clubName="Barcelona"
            position="Right Winger"
            age={17}
            nationality="Spain"
            marketValue={180000000}
            trendDiff={30000000}
            trendPercentage={20.0}
          />
          <PlayerRow
            rank={3}
            name="Casemiro"
            clubName="Manchester United"
            position="Defensive Midfield"
            age={32}
            nationality="Brazil"
            marketValue={12000000}
            trendDiff={-8000000}
            trendPercentage={-40.0}
          />
        </Card>
      </section>

      {/* 6. CLUB ROW */}
      <section className="space-y-4">
        <SectionHeader title="6. Club Row" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Layout: <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">crest | club name over league (muted) | squad value (amber, tabular-nums, right)</code>.
        </p>

        <Card className="space-y-1">
          <ClubRow
            rank={1}
            name="Real Madrid"
            leagueName="LaLiga"
            country="Spain"
            squadSize={25}
            squadValue={1360000000}
          />
          <ClubRow
            rank={2}
            name="Manchester City"
            leagueName="Premier League"
            country="England"
            squadSize={23}
            squadValue={1260000000}
          />
          <ClubRow
            rank={3}
            name="Bayern Munich"
            leagueName="Bundesliga"
            country="Germany"
            squadSize={26}
            squadValue={940000000}
          />
        </Card>
      </section>

      {/* 7. TRANSFER ROW */}
      <section className="space-y-4">
        <SectionHeader title="7. Transfer Row" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Layout: <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">player avatar + name | from-club crest -&gt; to-club crest | fee (amber, tabular-nums) | date (muted)</code>.
        </p>

        <Card className="space-y-1">
          <TransferRow
            playerName="Kylian Mbappé"
            playerPosition="Centre-Forward"
            fromClubName="Paris Saint-Germain"
            toClubName="Real Madrid"
            fee="Free"
            transferType="Free Transfer"
            date="Jul 1, 2024"
          />
          <TransferRow
            playerName="Julián Álvarez"
            playerPosition="Centre-Forward"
            fromClubName="Manchester City"
            toClubName="Atlético Madrid"
            fee={75000000}
            date="Aug 12, 2024"
          />
          <TransferRow
            playerName="Raheem Sterling"
            playerPosition="Left Winger"
            fromClubName="Chelsea"
            toClubName="Arsenal"
            fee="Loan"
            transferType="Loan"
            date="Aug 30, 2024"
          />
        </Card>
      </section>

      {/* 8. TABS COMPONENT */}
      <section className="space-y-4">
        <SectionHeader title="8. Tabs (Chip-style Navigation)" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Accessible <code className="px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">role=&quot;tablist&quot;</code> with Left/Right Arrow key navigation, Home/End cycling, and chip styling.
        </p>

        <Card className="space-y-4">
          <Tabs
            tabs={sampleTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div
            role="tabpanel"
            className="p-4 rounded-xl bg-[var(--bg-chip)] text-sm text-[var(--text-primary)]"
          >
            Active Panel: <strong className="text-[var(--accent)] uppercase">{activeTab}</strong>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Press Arrow Left / Right to cycle tabs smoothly with complete keyboard accessibility.
            </p>
          </div>
        </Card>
      </section>

      {/* 9. SKELETON PLACEHOLDERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader title="9. Skeleton Loading States" className="mb-0" />
          <button
            type="button"
            onClick={() => setIsLoadingDemo((prev) => !prev)}
            className="text-xs font-semibold px-3 py-1.5 rounded-[var(--chip-radius)] bg-[var(--bg-chip)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {isLoadingDemo ? "Show Normal" : "Simulate Loading"}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Fixed dimension placeholders preventing cumulative layout shift (CLS).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Match Row Skeleton
            </span>
            <MatchRowSkeleton />
            <MatchRowSkeleton />
          </Card>

          <Card className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Player Row Skeleton
            </span>
            <PlayerRowSkeleton />
            <PlayerRowSkeleton />
          </Card>

          <Card className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Club Row Skeleton
            </span>
            <ClubRowSkeleton />
            <ClubRowSkeleton />
          </Card>

          <Card className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Transfer Row Skeleton
            </span>
            <TransferRowSkeleton />
            <TransferRowSkeleton />
          </Card>
        </div>
      </section>

      {/* 10. EMPTY & ERROR STATES */}
      <section className="space-y-4">
        <SectionHeader title="10. Empty and Error States" />
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Short, plain copy: &quot;No results yet.&quot; and &quot;Couldn&apos;t load this right now. Try again.&quot;
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No results yet."
            message="We couldn't find any matches or transfers matching your criteria."
            action={
              <Chip active onClick={() => setActiveChip("all")}>
                Reset Filters
              </Chip>
            }
          />

          <ErrorState
            title="Couldn't load this right now."
            message="Please check your connection and try again."
            onRetry={() => alert("Retrying operation...")}
          />
        </div>
      </section>
    </div>
  );
}
