"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  Users,
  Shield,
  TrendingUp,
  MoreHorizontal,
  X,
  Newspaper,
  Trophy,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function BottomNav({ liveCount }: { liveCount?: number | null }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close sheet on route navigation
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Close sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoreOpen]);

  // Active route helpers
  const isMatchesActive = pathname === "/matches" || pathname.startsWith("/matches/") || pathname.startsWith("/match/");
  const isPlayersActive = pathname === "/players" || pathname.startsWith("/players/") || pathname.startsWith("/player/");
  const isClubsActive = pathname === "/clubs" || pathname.startsWith("/clubs/") || pathname.startsWith("/club/");
  const isValuesActive = pathname === "/values";
  const isMoreActive =
    isMoreOpen ||
    pathname.startsWith("/leagues") ||
    pathname.startsWith("/transfers") ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/methodology");

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[var(--bg-card)]/95 border-t border-[var(--divider)] backdrop-blur-xl transition-transform duration-200"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {/* 1. Matches */}
          <Link
            href="/matches"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isMatchesActive
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Matches"
          >
            <div className="relative flex items-center justify-center">
              <Radio className="w-5 h-5" />
              {liveCount !== null && liveCount !== undefined && liveCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full text-[9px] font-bold text-[var(--accent-contrast)] bg-[var(--live)] flex items-center justify-center leading-none">
                  {liveCount}
                </span>
              )}
            </div>
            <span className="tracking-tight mt-0.5">Matches</span>
          </Link>

          {/* 2. Players */}
          <Link
            href="/players"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isPlayersActive
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Players"
          >
            <Users className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Players</span>
          </Link>

          {/* 3. Clubs */}
          <Link
            href="/clubs"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isClubsActive
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Clubs"
          >
            <Shield className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Clubs</span>
          </Link>

          {/* 4. Values */}
          <Link
            href="/values"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isValuesActive
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Market Values"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Values</span>
          </Link>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isMoreActive
                ? "text-[var(--accent)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="More navigation options"
            aria-expanded={isMoreOpen}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {isMoreOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity sm:hidden"
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More Navigation"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[var(--card-radius)] bg-[var(--bg-card)] p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl sm:hidden"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Grab handle & header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-1 rounded-full bg-[var(--divider)]" />
              <div className="w-full flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  More
                </span>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  aria-label="Close sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col space-y-1">
              <Link
                href="/news"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Newspaper className="w-5 h-5 text-[var(--accent)]" />
                <span>News</span>
              </Link>

              <Link
                href="/leagues"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Trophy className="w-5 h-5 text-[var(--accent)]" />
                <span>Leagues</span>
              </Link>

              <Link
                href="/transfers"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <ArrowLeftRight className="w-5 h-5 text-[var(--accent)]" />
                <span>Transfers</span>
              </Link>

              <Link
                href="/methodology"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                <span>Methodology</span>
              </Link>
            </nav>

            {/* Theme Toggle row */}
            <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Appearance
              </span>
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </>
  );
}
