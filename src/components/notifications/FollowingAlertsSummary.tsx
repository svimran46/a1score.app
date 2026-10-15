"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import type { WatchlistItem } from "@/lib/watchlist/storage";
import { MenuGroup } from "@/components/more/MenuRow";

function AvatarStack({ items }: { items: WatchlistItem[] }) {
  const shown = items.slice(0, 3);
  return (
    <span className="flex -space-x-2" aria-hidden="true">
      {shown.map((item) => {
        const src = item.avatarUrl || item.clubCrest;
        return (
          <span
            key={item.id}
            className="w-8 h-8 rounded-full bg-[var(--bg-chip)] ring-2 ring-[var(--bg-card)] overflow-hidden flex items-center justify-center"
          >
            {src && <Image src={src} alt="" width={32} height={32} className="object-contain w-8 h-8" unoptimized />}
          </span>
        );
      })}
    </span>
  );
}

function Row({ label, items, href, note }: { label: string; items: WatchlistItem[]; href: string; note?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 min-h-[64px] px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium text-[var(--text-primary)]">{label}</span>
        {note && <span className="block text-[13px] text-[var(--text-muted)] mt-0.5">{note}</span>}
      </span>
      <AvatarStack items={items} />
      <span className="min-w-[44px] h-8 px-3 rounded-full border border-[var(--divider)] flex items-center justify-center text-sm font-bold tabular-nums text-[var(--text-primary)]">
        {items.length}
        <span className="sr-only"> followed</span>
      </span>
      <ChevronRight aria-hidden="true" className="w-4 h-4 text-[var(--text-muted)]" />
    </Link>
  );
}

/** What the user follows, grouped like FotMob's Notifications → Following. */
export function FollowingAlertsSummary() {
  const { isMounted, clubFavorites, playerFavorites, leagueFavorites } = useWatchlist();

  if (!isMounted) {
    return <div className="h-[200px] rounded-[var(--card-radius)] bg-[var(--bg-card)] animate-pulse" aria-hidden="true" />;
  }

  return (
    <MenuGroup title="Following">
      <Row label="Players" items={playerFavorites} href="/following" note="Value alerts cover the players you follow" />
      <Row label="Teams" items={clubFavorites} href="/following" />
      <Row label="Leagues" items={leagueFavorites} href="/leagues" />
    </MenuGroup>
  );
}
