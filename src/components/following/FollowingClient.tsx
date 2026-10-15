"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Plus, Scale, Shield, Star, TrendingDown, TrendingUp, User, X } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import type { WatchlistItem } from "@/lib/watchlist/storage";
import { followValueChange } from "@/lib/watchlist/valueChange";
import { formatCompactEur } from "@/lib/utils";
import { openSearch } from "@/lib/nav/search";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { EmptyState } from "@/components/ui";

type Tab = "teams" | "players";

const CARD_CLASS =
  "group relative flex flex-col min-h-[168px] p-4 rounded-[var(--card-radius)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors";

function RemoveButton({ item, onRemove }: { item: WatchlistItem; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Unfollow ${item.name}`}
      className="absolute top-2 right-2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-[var(--bg-chip)] text-[var(--text-primary)] hover:text-[var(--trend-down)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
    >
      <X aria-hidden="true" className="w-4 h-4" />
    </button>
  );
}

function TeamCard({ item, editing, onRemove }: { item: WatchlistItem; editing: boolean; onRemove: () => void }) {
  const crest = item.avatarUrl || item.clubCrest;
  const value = item.currentValueEur || item.initialValueEur || 0;
  return (
    <li className={CARD_CLASS}>
      <Link
        href={item.slug ? `/clubs/${item.slug}` : `/clubs/${item.id}`}
        aria-label={item.name}
        className="absolute inset-0 z-0 rounded-[var(--card-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      />
      {editing && <RemoveButton item={item} onRemove={onRemove} />}
      <div className="relative w-12 h-12 flex items-center justify-center pointer-events-none">
        {crest ? (
          <Image src={crest} alt="" width={48} height={48} className="object-contain w-12 h-12" unoptimized />
        ) : (
          <Shield aria-hidden="true" className="w-10 h-10 text-[var(--text-muted)]" />
        )}
      </div>
      <h3 className="mt-auto pt-4 text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-2 pointer-events-none">
        {item.name}
      </h3>
      <p className="mt-1 text-xs text-[var(--text-muted)] pointer-events-none">
        {value > 0 ? (
          <>
            <span className="font-bold text-[var(--value-text)] figure tabular-nums">{formatCompactEur(value)}</span>
            {" squad value"}
          </>
        ) : (
          "Squad value unavailable"
        )}
      </p>
    </li>
  );
}

function PlayerCard({ item, editing, onRemove }: { item: WatchlistItem; editing: boolean; onRemove: () => void }) {
  const { current, pct } = followValueChange(item);
  const up = pct != null && pct > 0;
  return (
    <li className={CARD_CLASS}>
      <Link
        href={item.slug ? `/players/${item.slug}` : `/players/${item.id}`}
        aria-label={item.name}
        className="absolute inset-0 z-0 rounded-[var(--card-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      />
      {editing && <RemoveButton item={item} onRemove={onRemove} />}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-chip)] flex items-center justify-center pointer-events-none">
        {item.avatarUrl ? (
          <Image src={item.avatarUrl} alt="" width={48} height={48} className="object-cover w-12 h-12" unoptimized />
        ) : (
          <User aria-hidden="true" className="w-6 h-6 text-[var(--text-muted)]" />
        )}
      </div>
      <h3 className="mt-auto pt-4 text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-2 pointer-events-none">
        {item.name}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)] truncate pointer-events-none">
        {item.clubCrest && (
          <Image src={item.clubCrest} alt="" width={14} height={14} className="object-contain w-3.5 h-3.5 shrink-0" unoptimized />
        )}
        <span className="truncate">{item.clubName || "Free agent"}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-2 pointer-events-none">
        <span className="text-sm font-bold text-[var(--value-text)] figure tabular-nums">
          {current > 0 ? formatCompactEur(current) : "—"}
        </span>
        {pct != null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${up ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"}`}
          >
            {up ? <TrendingUp aria-hidden="true" className="w-3 h-3" /> : <TrendingDown aria-hidden="true" className="w-3 h-3" />}
            {`${up ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`}
            <span className="sr-only"> since you followed</span>
          </span>
        )}
      </p>
    </li>
  );
}

export function FollowingClient() {
  const { isMounted, playerFavorites, clubFavorites, unfollow, isStorageAvailable } = useWatchlist();
  const [tab, setTab] = useState<Tab>("teams");
  const [editing, setEditing] = useState(false);

  const items = tab === "teams" ? clubFavorites : playerFavorites;
  const compareSlugs = playerFavorites.slice(0, 3).map((p) => p.slug || p.id);

  return (
    <div className="max-w-[720px] mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-1">
        <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-[var(--text-primary)] px-1">Following</h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
            className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Find teams and players to follow"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <Plus aria-hidden="true" className="w-6 h-6 rounded-full border-2 border-current p-0.5" />
        </button>
      </div>

      <UnderlineTabs
        idPrefix="following"
        ariaLabel="Followed teams and players"
        activeTab={tab}
        onChange={(id) => {
          setTab(id as Tab);
          setEditing(false);
        }}
        tabs={[
          { id: "teams", label: "Teams", count: isMounted ? clubFavorites.length : undefined },
          { id: "players", label: "Players", count: isMounted ? playerFavorites.length : undefined },
        ]}
      />

      {isMounted && !isStorageAvailable && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
          <AlertCircle aria-hidden="true" className="w-4 h-4 text-[var(--value-text)] shrink-0 mt-0.5" />
          <p>Browser storage is unavailable, so follows only last for this session.</p>
        </div>
      )}

      <div role="tabpanel" id={`following-panel-${tab}`} aria-labelledby={`following-tab-${tab}`}>
        {!isMounted ? (
          <ul className="grid grid-cols-2 gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="min-h-[168px] rounded-[var(--card-radius)] bg-[var(--bg-card)] animate-pulse" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Star className="w-6 h-6" />}
            title={tab === "teams" ? "You're not following any teams" : "You're not following any players"}
            message="Tap the star on a club or player page to follow it. Players show how their value has moved since you followed them."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openSearch}
                  className="min-h-[44px] px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  Search
                </button>
                <Link
                  href={tab === "teams" ? "/clubs" : "/values"}
                  className="min-h-[44px] px-4 inline-flex items-center rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  {tab === "teams" ? "Browse clubs" : "Browse player values"}
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item) =>
                tab === "teams" ? (
                  <TeamCard key={item.id} item={item} editing={editing} onRemove={() => unfollow(item.id, "club")} />
                ) : (
                  <PlayerCard key={item.id} item={item} editing={editing} onRemove={() => unfollow(item.id, "player")} />
                )
              )}
            </ul>
            {tab === "players" && compareSlugs.length >= 2 && !editing && (
              <Link
                href={`/compare?players=${compareSlugs.join(",")}`}
                className="mt-4 min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Scale aria-hidden="true" className="w-4 h-4 text-[var(--value-text)]" />
                Compare {compareSlugs.length === 2 ? "these two" : "your top three"}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
