"use client";

import React from "react";

import { formatFeeLabel } from "@/lib/transfers";
import { useMoney } from "@/lib/useMoney";
import type { FeeStatus } from "@/lib/data/playerProfile.types";
import { NotRecorded } from "@/components/players/ProfileSection";

/** A non-headline transfer fee ("Loan, €2M fee", "Free transfer", "—") in the display currency. */
export function FeeLabel({ status, feeEur }: { status: FeeStatus; feeEur: number | null }) {
  const money = useMoney();
  const fee = formatFeeLabel(status, feeEur, money.ctx);
  if (fee.srLabel) return <NotRecorded mark={fee.label} sr={fee.srLabel} />;
  return <span className={status === "undisclosed" ? "text-text-muted" : "text-text-secondary"}>{fee.label}</span>;
}
