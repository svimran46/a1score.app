"use client";

import { useState, useEffect, useRef } from "react";
import { useMatchSync } from "@/hooks/useMatchSync";
import { MatchScorecard } from "@/components/MatchScorecard";
import { MatchTabs } from "@/components/MatchTabs";

interface MatchCenterClientProps {
  initialMatch: any;
}

export function MatchCenterClient({ initialMatch }: MatchCenterClientProps) {
  const { data: match, goalHighlight, lastUpdatedTime } = useMatchSync(initialMatch.id, initialMatch);

  const [isScorecardOutOfView, setIsScorecardOutOfView] = useState(false);
  const scorecardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scorecardRef.current;
    if (!el || typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When scorecard is scrolled out above the viewport
        setIsScorecardOutOfView(!entry.isIntersecting && entry.boundingClientRect.bottom < 120);
      },
      {
        threshold: 0.05,
        rootMargin: "-60px 0px 0px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Main Scorecard */}
      <div ref={scorecardRef}>
        <MatchScorecard
          match={match}
          goalHighlight={goalHighlight}
          lastUpdatedTime={lastUpdatedTime}
        />
      </div>

      {/* Tabs System (Sticky bar + tabs, Facts, Lineup, Table, Stats, H2H, Values) */}
      <MatchTabs match={match} isScorecardOutOfView={isScorecardOutOfView} />
    </div>
  );
}
