"use client";

import React from "react";

import { useMoney } from "@/lib/useMoney";

/**
 * A euro amount shown in the visitor's display currency. Use this in server
 * components; client components can call `useMoney()` directly.
 */
export function Money({
  eur,
  kind = "compact",
  fallback = "—",
}: {
  eur: number | bigint | null | undefined;
  /**
   * compact: "€180M" ("Free" for 0) · value: "€180M" (fallback for 0/none)
   * full: "€180,000,000" · signed: "+€20M" / "−€5M" · spoken: "180 million euros"
   */
  kind?: "compact" | "value" | "full" | "signed" | "spoken";
  fallback?: string;
}) {
  const money = useMoney();
  const n = eur == null ? null : Number(eur);
  switch (kind) {
    case "value":
      return <>{money.value(n) ?? fallback}</>;
    case "full":
      return <>{money.full(eur)}</>;
    case "signed":
      return <>{n == null ? fallback : money.signed(n)}</>;
    case "spoken":
      return <>{n == null ? fallback : money.spoken(n)}</>;
    default:
      return <>{money.compact(eur)}</>;
  }
}
