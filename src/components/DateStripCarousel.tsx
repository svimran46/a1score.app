"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateStripCarouselProps {
  activeDate: string; // YYYYMMDD
  activeFilter?: string;
  scope?: string;
  displayDateStr?: string;
}

export function DateStripCarousel({
  activeDate,
  activeFilter = "all",
  scope,
  displayDateStr,
}: DateStripCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Parse active date
  const { days, prevDateStr, nextDateStr, activeDayLabel } = useMemo(() => {
    const y = parseInt(activeDate.slice(0, 4), 10);
    const m = parseInt(activeDate.slice(4, 6), 10) - 1;
    const d = parseInt(activeDate.slice(6, 8), 10);
    const baseDate = new Date(Date.UTC(y, m, d));

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().slice(0, 10).replace(/-/g, "");

    const prevDate = new Date(baseDate);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const prevStr = prevDate.toISOString().slice(0, 10).replace(/-/g, "");

    const nextDate = new Date(baseDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextStr = nextDate.toISOString().slice(0, 10).replace(/-/g, "");

    const datesList = [];
    let currentLabel = "";

    for (let offset = -3; offset <= 3; offset++) {
      const cur = new Date(baseDate);
      cur.setUTCDate(cur.getUTCDate() + offset);

      const dateStr = cur.toISOString().slice(0, 10).replace(/-/g, "");
      const isToday = dateStr === todayStr;
      const isActive = dateStr === activeDate;

      const weekdayShort = isToday
        ? "Today"
        : cur.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

      const dayMonth = cur.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });

      if (isActive) {
        currentLabel = isToday
          ? `Today, ${dayMonth}`
          : cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
      }

      datesList.push({
        dateStr,
        weekdayShort,
        dayMonth,
        isToday,
        isActive,
      });
    }

    return {
      days: datesList,
      prevDateStr: prevStr,
      nextDateStr: nextStr,
      activeDayLabel: currentLabel,
    };
  }, [activeDate]);

  return (
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
      {/* Desktop Prev Arrow */}
      <Link
        href={`/matches?date=${prevDateStr}&filter=${activeFilter}${scope ? `&scope=${scope}` : ""}`}
        className="hidden md:flex min-w-[36px] min-h-[44px] items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
        aria-label="Previous Day"
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {/* Date Carousel with snap and centered active item */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {days.map((item) => (
          <Link
            key={item.dateStr}
            href={`/matches?date=${item.dateStr}&filter=${activeFilter}${scope ? `&scope=${scope}` : ""}`}
            className={`flex-shrink-0 snap-center flex flex-col items-center justify-center min-w-[64px] sm:min-w-[72px] h-[52px] sm:h-[56px] px-2 sm:px-3 rounded-xl border text-xs transition-all active:scale-95 ${
              item.isActive
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-md shadow-amber-500/5"
                : "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <time
              dateTime={`${item.dateStr.slice(0, 4)}-${item.dateStr.slice(4, 6)}-${item.dateStr.slice(6, 8)}`}
              suppressHydrationWarning
              className="flex flex-col items-center leading-tight"
            >
              <span className="text-[11px] font-bold tracking-tight">
                {item.weekdayShort}
              </span>
              <span className="text-[10px] text-slate-400 font-medium tabular-nums mt-0.5">
                {item.dayMonth}
              </span>
            </time>
          </Link>
        ))}
      </div>

      {/* Desktop Next Arrow */}
      <Link
        href={`/matches?date=${nextDateStr}&filter=${activeFilter}${scope ? `&scope=${scope}` : ""}`}
        className="hidden md:flex min-w-[36px] min-h-[44px] items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
        aria-label="Next Day"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>

      {/* Full Date Small Label (small pill or label on desktop) */}
      <div className="hidden lg:flex items-center shrink-0 pl-2 border-l border-slate-800">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
          {displayDateStr || activeDayLabel}
        </span>
      </div>
    </div>
  );
}
