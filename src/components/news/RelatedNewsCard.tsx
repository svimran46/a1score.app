import React from "react";
import { NewsItem } from "@/types/news";
import { NewsCardRow } from "./NewsCardRow";
import { Card } from "@/components/ui";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProfileSection } from "@/components/players/ProfileSection";
import type { PlayerProfileVM } from "@/lib/data/playerProfile.types";

interface RelatedNewsCardProps {
  items: NewsItem[];
  title?: string;
  className?: string;
  limit?: number;
}

/**
 * Related news widget for Player and Club detail pages.
 * Displays 2-3 compact items driven by matching tags.
 * Returns null if no matching news items are found.
 */
export function RelatedNewsCard({
  items,
  title = "Related news",
  className = "",
  limit = 3,
}: RelatedNewsCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const displayItems = items.slice(0, limit);

  return (
    <section className={`space-y-2 ${className}`}>
      <SectionHeader
        title={title}
        href="/news"
        actionLabel="See all news"
        count={displayItems.length}
      />
      <Card className="p-1 overflow-hidden">
        <div className="divide-y divide-[var(--divider)]">
          {displayItems.map((item) => (
            <NewsCardRow key={item.id} item={item} />
          ))}
        </div>
      </Card>
    </section>
  );
}

/**
 * News (#news) on the player profile: at most 3 rows, no count badge.
 * The heading says honestly when every story only mentions the club.
 */
export function NewsSection({ vm }: { vm: PlayerProfileVM }) {
  const items = vm.news?.items.slice(0, 3) ?? [];
  if (items.length === 0) return null;
  const clubOnly = vm.news?.scope === "club" && vm.club;
  const title = clubOnly ? `News mentioning ${vm.club!.shortName || vm.club!.name}` : "News";

  return (
    <ProfileSection id="news" navLabel="News" title={title}>
      <div className="-mx-3 divide-y divide-[var(--divider)]">
        {items.map((item) => (
          <NewsCardRow key={item.id} item={item} />
        ))}
      </div>
    </ProfileSection>
  );
}
