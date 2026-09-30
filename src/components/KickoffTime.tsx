"use client";

import { useEffect, useState } from "react";
import { formatKickoff } from "@/lib/utils";

interface KickoffTimeProps {
  date: string | number | Date | null | undefined;
  includeDate?: boolean;
  forceTz?: string;
  className?: string;
}

export function KickoffTime({
  date,
  includeDate = false,
  forceTz,
  className,
}: KickoffTimeProps) {
  const iso = date ? new Date(date).toISOString() : undefined;

  // Server-rendered initial state is always UTC with label (guaranteed 0 hydration mismatch)
  const [displayText, setDisplayText] = useState<string>(() =>
    formatKickoff(date, { tz: forceTz || "UTC", includeDate })
  );

  useEffect(() => {
    if (forceTz) return;
    try {
      const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDisplayText(formatKickoff(date, { tz: viewerTz, includeDate }));
    } catch {
      // Keep UTC fallback if viewer timezone resolution fails
    }
  }, [date, forceTz, includeDate]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {displayText}
    </time>
  );
}
