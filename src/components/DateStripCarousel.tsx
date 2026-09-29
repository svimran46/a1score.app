"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar } from "lucide-react";

interface DateStripCarouselProps {
  activeDate: string; // YYYYMMDD
  activeFilter?: string;
}

export function DateStripCarousel({
  activeDate,
  activeFilter = "all",
}: DateStripCarouselProps) {
  // Generate 7 days centered on activeDate
  const days = useMemo(() => {
    const y = parseInt(activeDate.slice(0, 4), 10);
    const m = parseInt(activeDate.slice(4, 6), 10) - 1;
    const d = parseInt(activeDate.slice(6, 8), 10);
    const baseDate = new Date(Date.UTC(y, m, d));

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().slice(0, 10).replace(/-/g, "");

    const datesList = [];

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

      datesList.push({
        dateStr,
        weekdayShort,
        dayMonth,
        isToday,
        isActive,
      });
    }

    return datesList;
  }, [activeDate]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar snap-x snap-mandatory scroll-smooth">
      {days.map((item) => (
        <Link
          key={item.dateStr}
          href={`/matches?date=${item.dateStr}&filter=${activeFilter}`}
          className={`flex-shrink-0 snap-start flex flex-col items-center justify-center min-w-[76px] px-3 py-2 rounded-2xl border text-xs transition-all ${
            item.isActive
              ? "bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-md shadow-amber-500/5"
              : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          <span className="text-[11px] font-bold tracking-tight">
            {item.weekdayShort}
          </span>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums mt-0.5">
            {item.dayMonth}
          </span>
        </Link>
      ))}
    </div>
  );
}
