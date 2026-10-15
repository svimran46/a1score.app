"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import type { TransferLeague, TransferRecord } from "@/lib/data/transfers";
import { Card, TransferRow } from "@/components/ui";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { MenuButton, MenuCheckboxItem, MenuItem, MenuLabel, MenuRadioItem } from "@/components/ui/MenuButton";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import { useMoney } from "@/lib/useMoney";
import {
  DEFAULT_TRANSFER_FILTERS,
  TRANSFER_SORT_OPTIONS,
  TRANSFER_TYPE_OPTIONS,
  activeFilterCount,
  filterTransfers,
  sortTransfers,
  type TransferFilters,
  type TransferSort,
} from "@/lib/transferFilters";

interface TransfersHubClientProps {
  initialRecords: TransferRecord[];
  initialCommercial: TransferRecord[];
  initialContractEnds: TransferRecord[];
  leagues: TransferLeague[];
}

type Tab = "latest" | "records" | "contracts";

const BIG_FEE_EUR = 10_000_000;

const TOOLBAR_BUTTON =
  "min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";

function Row({ t }: { t: TransferRecord }) {
  return (
    <TransferRow
      id={t.id}
      playerName={t.player?.commonName || t.player?.fullName || "Player"}
      playerSlug={t.player?.slug}
      playerAvatar={t.player?.photoUrl}
      playerPosition={t.player?.position}
      fromClubName={t.fromClubName}
      toClubName={t.toClubName}
      fee={t.feeEur}
      transferType={t.displayType}
      date={t.displayDate}
      isAgreedFutureDeal={t.isAgreedFutureDeal}
    />
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Remove filter: ${label}`}
      className="min-h-[36px] inline-flex items-center gap-1.5 pl-3 pr-2 rounded-full bg-[var(--bg-chip)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
    >
      {label}
      <X aria-hidden="true" className="w-3.5 h-3.5 text-[var(--text-muted)]" />
    </button>
  );
}

export function TransfersHubClient({
  initialRecords,
  initialCommercial,
  initialContractEnds,
  leagues,
}: TransfersHubClientProps) {
  const [tab, setTab] = useState<Tab>("latest");
  const [filters, setFilters] = useState<TransferFilters>(DEFAULT_TRANSFER_FILTERS);
  const [sort, setSort] = useState<TransferSort>("newest");
  const { isMounted, playerFavorites, clubFavorites } = useWatchlist();
  const money = useMoney();

  const followed = useMemo(
    () => ({
      players: new Set(playerFavorites.map((p) => p.id)),
      clubs: new Set(clubFavorites.map((c) => c.id)),
    }),
    [playerFavorites, clubFavorites]
  );
  const followsAnything = followed.players.size + followed.clubs.size > 0;

  const visible = useMemo(
    () => sortTransfers(filterTransfers(initialCommercial, filters, followed), sort),
    [initialCommercial, filters, followed, sort]
  );

  const set = (patch: Partial<TransferFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const filterCount = activeFilterCount(filters);
  const bigFeeLabel = `Fee ≥ ${money.value(BIG_FEE_EUR)}`;
  const leagueName = leagues.find((l) => l.id === filters.league)?.name;

  return (
    <div className="space-y-4">
      <UnderlineTabs
        idPrefix="transfers"
        ariaLabel="Transfer lists"
        activeTab={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "latest", label: "Latest" },
          { id: "records", label: "Record fees" },
          { id: "contracts", label: "Contract ends" },
        ]}
      />

      <div role="tabpanel" id={`transfers-panel-${tab}`} aria-labelledby={`transfers-tab-${tab}`} className="space-y-3">
        {tab === "latest" && (
          <>
            <div className="flex items-center gap-1">
              <p className="flex-1 px-1 text-sm font-semibold text-[var(--text-muted)]" aria-live="polite">
                {filterCount === 0 ? "All transfers" : `${visible.length} of ${initialCommercial.length} transfers`}
              </p>

              <MenuButton
                ariaLabel={filterCount ? `Filter, ${filterCount} active` : "Filter"}
                buttonClassName={TOOLBAR_BUTTON}
                label={
                  <>
                    <SlidersHorizontal aria-hidden="true" className="w-4 h-4" />
                    Filter
                    {filterCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[11px] font-bold flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </>
                }
              >
                <MenuLabel>Type</MenuLabel>
                {TRANSFER_TYPE_OPTIONS.map((o) => (
                  <MenuRadioItem key={o.value} checked={filters.type === o.value} onSelect={() => set({ type: o.value })}>
                    {o.label}
                  </MenuRadioItem>
                ))}
                {leagues.length > 0 && (
                  <>
                    <MenuLabel>League</MenuLabel>
                    <MenuRadioItem checked={filters.league === "all"} onSelect={() => set({ league: "all" })}>
                      All leagues
                    </MenuRadioItem>
                    {leagues.map((l) => (
                      <MenuRadioItem key={l.id} checked={filters.league === l.id} onSelect={() => set({ league: l.id })}>
                        {l.name}
                      </MenuRadioItem>
                    ))}
                  </>
                )}
                <MenuLabel>More</MenuLabel>
                <MenuCheckboxItem
                  checked={filters.minFeeEur > 0}
                  onToggle={() => set({ minFeeEur: filters.minFeeEur > 0 ? 0 : BIG_FEE_EUR })}
                >
                  {bigFeeLabel}
                </MenuCheckboxItem>
                <MenuCheckboxItem checked={filters.followingOnly} onToggle={() => set({ followingOnly: !filters.followingOnly })}>
                  Following only
                </MenuCheckboxItem>
                {filterCount > 0 && <MenuItem onSelect={() => setFilters(DEFAULT_TRANSFER_FILTERS)}>Clear all filters</MenuItem>}
              </MenuButton>

              <MenuButton
                ariaLabel={`Sort: ${TRANSFER_SORT_OPTIONS.find((o) => o.value === sort)?.label}`}
                buttonClassName={TOOLBAR_BUTTON}
                label={
                  <>
                    <ArrowDownUp aria-hidden="true" className="w-4 h-4" />
                    Sort
                  </>
                }
              >
                {TRANSFER_SORT_OPTIONS.map((o) => (
                  <MenuRadioItem key={o.value} checked={sort === o.value} onSelect={() => setSort(o.value)}>
                    {o.label}
                  </MenuRadioItem>
                ))}
              </MenuButton>
            </div>

            {filterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.type !== "all" && (
                  <FilterChip
                    label={TRANSFER_TYPE_OPTIONS.find((o) => o.value === filters.type)!.label}
                    onClear={() => set({ type: "all" })}
                  />
                )}
                {filters.league !== "all" && leagueName && (
                  <FilterChip label={leagueName} onClear={() => set({ league: "all" })} />
                )}
                {filters.minFeeEur > 0 && <FilterChip label={bigFeeLabel} onClear={() => set({ minFeeEur: 0 })} />}
                {filters.followingOnly && <FilterChip label="Following only" onClear={() => set({ followingOnly: false })} />}
              </div>
            )}

            <Card className="p-1 overflow-hidden">
              {visible.length === 0 ? (
                <div className="py-10 px-4 text-center text-sm text-[var(--text-muted)] space-y-3">
                  {filters.followingOnly && isMounted && !followsAnything ? (
                    <p>
                      You don&apos;t follow any players or clubs yet.{" "}
                      <Link href="/following" className="font-semibold text-[var(--accent)] hover:underline">
                        Find some to follow
                      </Link>{" "}
                      to see their moves here.
                    </p>
                  ) : (
                    <p>No transfers match these filters.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_TRANSFER_FILTERS)}
                    className="min-h-[44px] px-4 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--divider)]">
                  {visible.map((t) => (
                    <Row key={t.id} t={t} />
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {tab === "records" && (
          <>
            <p className="px-1 text-sm font-semibold text-[var(--text-muted)]">Top 20 documented fees of all time</p>
            <Card className="p-1 overflow-hidden">
              <ol className="divide-y divide-[var(--divider)]">
                {initialRecords.map((t, idx) => (
                  <li key={t.id} className="relative flex items-center">
                    <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)] pl-2 shrink-0 select-none tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Row t={t} />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </>
        )}

        {tab === "contracts" && (
          <>
            <p className="px-1 text-sm font-semibold text-[var(--text-muted)]">Contract expiries, releases and retirements</p>
            <Card className="p-1 overflow-hidden">
              {initialContractEnds.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No recent contract expiries or retirements recorded.
                </div>
              ) : (
                <div className="divide-y divide-[var(--divider)]">
                  {initialContractEnds.map((t) => (
                    <Row key={t.id} t={t} />
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
