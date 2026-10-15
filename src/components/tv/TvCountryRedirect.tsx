"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TV_COUNTRY_STORAGE_KEY, countryFromLocales, isTvCountry } from "@/lib/tv/countries";

/** /tv without a country: open the saved country, else one guessed from the browser language. */
export function TvCountryRedirect() {
  const router = useRouter();
  useEffect(() => {
    let code: string | null = null;
    try {
      code = window.localStorage.getItem(TV_COUNTRY_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (!isTvCountry(code)) code = countryFromLocales(navigator.languages ?? [navigator.language]);
    router.replace(`/tv?country=${code}`);
  }, [router]);

  return (
    <div className="max-w-[720px] mx-auto space-y-3" aria-busy="true" aria-label="Loading TV schedules">
      <div className="h-10 w-48 rounded-xl bg-[var(--bg-chip)] animate-pulse" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-[var(--card-radius)] bg-[var(--bg-card)] animate-pulse" />
      ))}
    </div>
  );
}
