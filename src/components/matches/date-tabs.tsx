"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { toDateKey } from "@/lib/match-status";
import { cn } from "@/lib/utils";

/**
 * Yesterday / Today / Tomorrow quick tabs plus a native date picker.
 * The selected date lives in the URL (`?date=YYYY-MM-DD`) so any day is
 * shareable and back/forward just works (Section 10).
 */
export function DateTabs({ date }: { date: string }) {
  const router = useRouter();

  const now = new Date();
  const today = toDateKey(now);
  const yesterday = toDateKey(new Date(now.getTime() - 86_400_000));
  const tomorrow = toDateKey(new Date(now.getTime() + 86_400_000));

  const quick = [
    { key: yesterday, label: "Yesterday" },
    { key: today, label: "Today" },
    { key: tomorrow, label: "Tomorrow" },
  ];

  function go(next: string) {
    router.push(next === today ? "/" : `/?date=${next}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Match date"
        className="bg-muted flex flex-1 items-center gap-1 rounded-lg p-1"
      >
        {quick.map((q) => {
          const active = q.key === date;
          return (
            <button
              key={q.key}
              role="tab"
              aria-selected={active}
              onClick={() => go(q.key)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none sm:text-sm",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <label className="relative">
        <span className="sr-only">Pick a date</span>
        <CalendarDays
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) go(e.target.value);
          }}
          className="bg-card h-9 rounded-md border pr-2 pl-8 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>
    </div>
  );
}
