"use client";

import React, { useEffect, useState } from "react";
import { TV_COUNTRY_STORAGE_KEY, isTvCountry, tvCountryName } from "@/lib/tv/countries";

/** The saved TV schedules country, for the More row ("TV schedules · Malaysia"). */
export function TvCountryLabel() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    try {
      const code = window.localStorage.getItem(TV_COUNTRY_STORAGE_KEY);
      setName(isTvCountry(code) ? tvCountryName(code) : null);
    } catch {
      // ignore
    }
  }, []);
  return <>{name ?? "Which channel is showing the match"}</>;
}
