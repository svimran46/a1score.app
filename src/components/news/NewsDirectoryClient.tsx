"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { NewsItem } from "@/types/news";
import { NewsCardHero } from "./NewsCardHero";
import { NewsCardRow } from "./NewsCardRow";
import { Card, Chip, EmptyState, ErrorState, Skeleton, PageHeader } from "@/components/ui";
import { AdSlot } from "@/components/ads/AdSlot";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import {
  NEWS_LEAGUES,
  NEWS_TABS,
  forYouFeed,
  leagueFeed,
  newestFirst,
  transfersFeed,
  type NewsTab,
} from "@/lib/news/feeds";

interface NewsDirectoryClientProps {
  initialNews: NewsItem[];
}

export function NewsDirectoryClient({ initialNews }: NewsDirectoryClientProps) {
  const [tab, setTab] = useState<NewsTab>("for-you");
  const [league, setLeague] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const { isMounted, favorites } = useWatchlist();

  const followedNames = useMemo(() => favorites.map((f) => f.name), [favorites]);
  const personalised = useMemo(() => forYouFeed(news, followedNames), [news, followedNames]);

  // Nothing followed (or nothing matching yet): For you falls back to Latest
  // with a nudge, rather than an empty screen.
  const forYouFallback = isMounted && personalised.length === 0;

  const filteredNews = useMemo(() => {
    switch (tab) {
      case "for-you":
        return forYouFallback || !isMounted ? newestFirst(news) : personalised;
      case "transfers":
        return transfersFeed(news);
      case "leagues":
        return leagueFeed(news, league);
      default:
        return newestFirst(news);
    }
  }, [tab, news, personalised, forYouFallback, isMounted, league]);

  // Leaving the Leagues tab clears its sub-filter.
  useEffect(() => {
    if (tab !== "leagues") setLeague(null);
  }, [tab]);

  const handleRetry = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.items || []);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const heroItem = filteredNews.length > 0 ? filteredNews[0] : null;
  const listItems = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  return (
    <div className="space-y-4 max-w-[720px] mx-auto">
      <PageHeader variant="directory" title="News" />

      <UnderlineTabs
        idPrefix="news"
        ariaLabel="News feeds"
        tabs={NEWS_TABS}
        activeTab={tab}
        onChange={(id) => setTab(id as NewsTab)}
      />

      {tab === "leagues" && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1" aria-label="Filter by league">
          <Chip active={league === null} onClick={() => setLeague(null)}>
            All leagues
          </Chip>
          {NEWS_LEAGUES.map((name) => (
            <Chip key={name} active={league === name} onClick={() => setLeague(name)}>
              {name}
            </Chip>
          ))}
        </div>
      )}

      {tab === "for-you" && forYouFallback && (
        <p className="text-sm text-[var(--text-muted)] px-1">
          {favorites.length === 0 ? (
            <>
              <Link href="/following" className="font-semibold text-[var(--accent)] hover:underline">
                Follow teams and players
              </Link>{" "}
              to personalise this feed. Showing the latest news for now.
            </>
          ) : (
            "No stories about the teams and players you follow right now. Showing the latest news."
          )}
        </p>
      )}

      <div role="tabpanel" id={`news-panel-${tab}`} aria-labelledby={`news-tab-${tab}`} className="space-y-4">
      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <Skeleton className="w-full h-64" />
            <div className="p-5 space-y-3">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-3/4 h-6" />
              <Skeleton className="w-full h-4" />
            </div>
          </Card>
          <Card className="p-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="w-20 h-3" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-1/2 h-3" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ) : hasError ? (
        /* Error State */
        <ErrorState
          title="Couldn't load news right now."
          message="Please check your connection or try again in a few moments."
          onRetry={handleRetry}
        />
      ) : filteredNews.length === 0 ? (
        /* Empty State */
        <EmptyState
          title="No news yet. Check back soon."
          message="No articles in this feed right now. Check back shortly for updates."
          action={
            tab !== "latest" ? (
              <button
                type="button"
                onClick={() => setTab("latest")}
                className="px-4 py-2 rounded-[var(--chip-radius)] bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold"
              >
                View latest news
              </button>
            ) : undefined
          }
        />
      ) : (
        /* Normal State */
        <div className="space-y-4">
          {/* Top Hero Card */}
          {heroItem && <NewsCardHero item={heroItem} />}

          {/* Subsequent Articles List */}
          {listItems.length > 0 && (
            <Card className="p-1 overflow-hidden">
              <div className="divide-y divide-[var(--divider)]">
                {listItems.map((item) => (
                  <NewsCardRow key={item.id} item={item} />
                ))}
              </div>
            </Card>
          )}

          {/* Optional non-intrusive AdSlot at bottom of feed */}
          <AdSlot id="news-feed-footer" format="leaderboard" />
        </div>
      )}
      </div>
    </div>
  );
}
