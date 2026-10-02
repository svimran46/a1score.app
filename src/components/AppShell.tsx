import React from "react";
import { getLeagues } from "@/lib/data/leagues";
import { getMarketValueMovers } from "@/lib/data/players";
import { getNews } from "@/lib/data/news";
import { TopNav } from "@/components/shell/TopNav";
import { LeftRail } from "@/components/shell/LeftRail";
import { TabletLeaguesScroller } from "@/components/shell/TabletLeaguesScroller";
import { RightRail } from "@/components/shell/RightRail";
import { BottomNav } from "@/components/shell/BottomNav";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { Footer } from "@/components/Footer";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [leagues, movers, news] = await Promise.all([
    getLeagues().catch(() => []),
    getMarketValueMovers(5).catch(() => ({ risers: [], fallers: [] })),
    getNews().then((items) => items.slice(0, 4)).catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Small non-overlapping PWA banner */}
      <PwaInstallPrompt />

      {/* 72px FotMob-style Sticky Top Navigation */}
      <TopNav />

      {/* Centered Main Shell Container (max-width: 1280px) */}
      <div className="w-full max-w-[var(--container-max)] mx-auto px-4 lg:px-6 py-4 sm:py-6 flex-1">
        {/* Tablet Leagues Scroller (640px to 1023px) */}
        <TabletLeaguesScroller leagues={leagues} />

        {/* Responsive Grid: 3-column desktop (260px 1fr 320px, gap 16px) */}
        <div className="lg:grid lg:grid-cols-[var(--rail-left)_1fr_var(--rail-right)] lg:gap-[var(--gap)] items-start">
          {/* Left Rail (Desktop >= 1024px) */}
          <LeftRail leagues={leagues} />

          {/* Center Column: Primary Page Content */}
          <main id="main-content" className="min-w-0 flex-1 w-full pb-20 sm:pb-8">
            {children}

            {/* Below Content Rail on Mobile & Tablet (< 1024px) */}
            <div className="lg:hidden mt-8">
              <RightRail movers={movers} news={news} />
            </div>
          </main>

          {/* Right Rail (Desktop >= 1024px) */}
          <div className="hidden lg:block shrink-0">
            <RightRail movers={movers} news={news} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Fixed Bottom Navigation (< 640px) */}
      <BottomNav />
    </div>
  );
}
