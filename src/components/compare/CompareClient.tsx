"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CompareFactsTable, type ComparePlayerFact } from "./CompareFactsTable";
import { ComparePlayerPicker } from "./ComparePlayerPicker";
import type { ComparePlayerChartMeta } from "./CompareValuationChart";
import { Scale, Share2, Check, ArrowRightLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";

const CompareValuationChart = dynamic(
  () => import("./CompareValuationChart").then((m) => m.CompareValuationChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center space-y-3 animate-pulse">
        <div className="h-6 w-48 bg-[var(--bg-chip)] rounded mx-auto" />
        <div className="h-64 bg-[var(--bg-chip)] rounded-xl" />
      </div>
    ),
  }
);

interface CompareClientProps {
  initialPlayers: ComparePlayerFact[];
  initialSlugs: string[];
}

export function CompareClient({ initialPlayers, initialSlugs }: CompareClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const players = initialPlayers;
  const currentSlugs = players.map((p) => p.slug);

  const updateUrlSlugs = (newSlugs: string[]) => {
    if (newSlugs.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?players=${newSlugs.join(",")}`);
    }
  };

  const handleRemovePlayer = (slugToRemove: string) => {
    const updated = currentSlugs.filter(
      (s) => s.toLowerCase() !== slugToRemove.toLowerCase()
    );
    updateUrlSlugs(updated);
  };

  const handleAddPlayer = (newSlug: string) => {
    if (currentSlugs.length >= 3) return;
    if (currentSlugs.some((s) => s.toLowerCase() === newSlug.toLowerCase())) return;
    updateUrlSlugs([...currentSlugs, newSlug]);
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  };

  const chartPlayers: ComparePlayerChartMeta[] = players.map((p) => ({
    slug: p.slug,
    name: p.fullName,
    currentValue: p.latestMarketValue,
    marketValues: p.marketValues || [],
  }));

  const hasPlayers = players.length > 0;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-12">
      {/* 1. Header with Share and Actions */}
      <PageHeader
        variant="directory"
        title="Player Valuation Comparison"
        subtitle="Compare market values, career progression, and side-by-side stats for up to 3 players."
        actions={
          hasPlayers ? (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-label="Share comparison"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Share</span>
                </>
              )}
            </button>
          ) : undefined
        }
      />

      {/* 2. Player Slot Bar & Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Comparing ({players.length}/3):
          </span>
          {players.map((p) => (
            <span
              key={p.slug}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            >
              <span>{p.fullName}</span>
              <button
                type="button"
                onClick={() => handleRemovePlayer(p.slug)}
                className="text-[var(--text-muted)] hover:text-rose-400"
                aria-label={`Remove ${p.fullName}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Player Picker */}
        <ComparePlayerPicker
          currentSlugs={currentSlugs}
          onAddPlayer={handleAddPlayer}
          maxPlayers={3}
        />
      </div>

      {/* 3. Empty State with Curated Matchups */}
      {!hasPlayers ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-chip)] flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6 text-[var(--value-text)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Select Players to Compare
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
              Use the search bar above to add 1 to 3 players, or start with popular comparisons below.
            </p>
          </div>

          <div className="pt-3">
            <span className="text-xs font-semibold text-[var(--text-muted)] block mb-2.5">
              Popular Head-to-Head Comparisons:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "Haaland vs Mbappé", slugs: "erling-haaland,kylian-mbappe" },
                { label: "Bellingham vs Vinicius", slugs: "jude-bellingham,vinicius-junior" },
                { label: "Saka vs Foden vs Palmer", slugs: "bukayo-saka,phil-foden,cole-palmer" },
                { label: "Yamal vs Musiala", slugs: "lamine-yamal,jamal-musiala" },
              ].map((comp) => (
                <button
                  key={comp.slugs}
                  type="button"
                  onClick={() => router.push(`/compare?players=${comp.slugs}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Sparkles className="w-3 h-3 text-[var(--value-text)]" />
                  <span>{comp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4. Overlaid Valuation History Chart */}
          <CompareValuationChart players={chartPlayers} />

          {/* 5. Side-by-Side Facts Comparison Matrix */}
          <CompareFactsTable players={players} onRemovePlayer={handleRemovePlayer} />
        </div>
      )}
    </div>
  );
}
