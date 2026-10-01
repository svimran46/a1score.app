"use client";

import { useEffect, useState } from "react";
import { formatKickoff, formatKickoffTimeOnly } from "@/lib/utils";

interface KickoffTimeProps {
  date: string | number | Date | null | undefined;
  includeDate?: boolean;
  timeOnly?: boolean;
  forceTz?: string;
  className?: string;
}

export function KickoffTime({
  date,
  includeDate = false,
  timeOnly = false,
  forceTz,
  className,
}: KickoffTimeProps) {
  const iso = date ? new Date(date).toISOString() : undefined;

  // Server-rendered initial state is always UTC (guaranteed 0 hydration mismatch)
  const [displayText, setDisplayText] = useState<string>(() =>
    timeOnly
      ? formatKickoffTimeOnly(date, forceTz || "UTC")
      : formatKickoff(date, { tz: forceTz || "UTC", includeDate })
  );

  useEffect(() => {
    if (forceTz) return;
    try {
      const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDisplayText(
        timeOnly
          ? formatKickoffTimeOnly(date, viewerTz)
          : formatKickoff(date, { tz: viewerTz, includeDate })
      );
    } catch {
      // Keep UTC fallback if viewer timezone resolution fails
    }
  }, [date, forceTz, includeDate, timeOnly]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {displayText}
    </time>
  );
}
