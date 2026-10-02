"use client";

import React, { useState, useMemo, useTransition } from "react";
import { NewsItem } from "@/types/news";
import { NewsCardHero } from "./NewsCardHero";
import { NewsCardRow } from "./NewsCardRow";
import { Card, Chip, EmptyState, ErrorState, Skeleton, PageHeader } from "@/components/ui";
import { RefreshCw } from "lucide-react";

interface NewsDirectoryClientProps {
  initialNews: NewsItem[];
}

const CATEGORY_CHIPS = [
  { label: "All", val: "All" },
  { label: "Transfers", val: "Transfers" },
  { label: "Premier League", val: "Premier League" },
  { label: "LaLiga", val: "LaLiga" },
  { label: "Serie A", val: "Serie A" },
  { label: "Bundesliga", val: "Bundesliga" },
  { label: "Ligue 1", val: "Ligue 1" },
];

export function NewsDirectoryClient({ initialNews }: NewsDirectoryClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Filter items client-side or refetch
  const filteredNews = useMemo(() => {
    if (selectedCategory === "All") return news;

    const normTarget = selectedCategory.toLowerCase().replace(/[\s\-_]+/g, "");
    return news.filter((item) => {
      const matchTag = item.tags.some(
        (t) => t.toLowerCase().replace(/[\s\-_]+/g, "").includes(normTarget)
      );
      const matchTitle = item.title.toLowerCase().replace(/[\s\-_]+/g, "").includes(normTarget);
      return matchTag || matchTitle;
    });
  }, [news, selectedCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
  };

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
      {/* Header */}
      <PageHeader
        variant="directory"
        categoryLabel="Syndicated Coverage"
        title="Football News"
        subtitle="Latest breaking reports, valuation analysis, and transfer intelligence across European football."
      />

      {/* Filter Chips Bar */}
      <div
        role="tablist"
        aria-label="Filter news by competition or topic"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
      >
        {CATEGORY_CHIPS.map((chip) => (
          <Chip
            key={chip.val}
            active={selectedCategory === chip.val}
            onClick={() => handleSelectCategory(chip.val)}
          >
            {chip.label}
          </Chip>
        ))}
      </div>

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
          message={`No articles currently found under "${selectedCategory}". Check back shortly for updates.`}
          action={
            selectedCategory !== "All" ? (
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="px-4 py-2 rounded-[var(--chip-radius)] bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold"
              >
                View all news
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
        </div>
      )}
    </div>
  );
}
