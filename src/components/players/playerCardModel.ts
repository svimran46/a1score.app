/**
 * Pure text rules shared by PlayerHero and the player share card, so both
 * surfaces say exactly the same thing about a player's value.
 */

import type { PlayerProfileVM } from "@/lib/data/playerProfile.types";
import {
  describeDelta,
  formatDateGB,
  formatMonthYear,
  valueEurParts,
  type DeltaDescription,
} from "@/lib/format-value";

/** "Last market value" when the value is over a year old or the player has retired. */
export function valuationLabel(vm: PlayerProfileVM): "Market value" | "Last market value" {
  if (vm.valuation.staleness === "stale" || vm.status.kind === "retired") return "Last market value";
  return vm.valuation.label;
}

/**
 * The change line is only shown for a dated, current value: never for a value
 * with no date, a value over a year old, or a retired player.
 */
export function heroDelta(vm: PlayerProfileVM): DeltaDescription | null {
  const v = vm.valuation;
  if (!v.current || !v.current.asOf || !v.sincePrevious) return null;
  if (v.staleness === "stale" || vm.status.kind === "retired") return null;
  return describeDelta(v.sincePrevious);
}

function wholeMonthsBetween(from: Date, to: Date): number {
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Exactly one freshness line for the current value, or null when there is no value:
 * "Valued 12 Mar 2026", "Valued 12 Jan 2026 · 9 months ago", "Valued Jun 2023"
 * or "Valuation date not recorded".
 */
export function freshnessLine(vm: PlayerProfileVM, now: Date = new Date()): string | null {
  const current = vm.valuation.current;
  if (!current) return null;
  if (!current.asOf) return "Valuation date not recorded";
  if (vm.valuation.staleness === "stale" || vm.status.kind === "retired") {
    return `Valued ${formatMonthYear(current.asOf)}`;
  }
  const day = formatDateGB(current.asOf);
  if (!day) return "Valuation date not recorded";
  if (vm.valuation.staleness === "aging") {
    const months = wholeMonthsBetween(new Date(current.asOf), now);
    if (months >= 1) return `Valued ${day} · ${months} ${months === 1 ? "month" : "months"} ago`;
  }
  return `Valued ${day}`;
}

/** "32 months left"; null when unknown or under a month. */
export function contractLeftLine(monthsLeft: number | null): string | null {
  if (monthsLeft == null || !Number.isFinite(monthsLeft) || monthsLeft < 1) return null;
  const n = Math.floor(monthsLeft);
  return `${n} ${n === 1 ? "month" : "months"} left`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface PlayerShareCardModel {
  name: string;
  nameSize: 64 | 52;
  initials: string;
  photoUrl: string | null;
  /** "Centre-Forward · Manchester City", null when neither is known. */
  meta: string | null;
  label: "Market value" | "Last market value";
  value: { currency: string; number: string; suffix: string } | null;
  delta: {
    direction: DeltaDescription["direction"];
    /** Identical to the hero's change line (describeDelta(...).text). */
    text: string;
    /** text split for colouring: `${lead}${basis}` === text */
    lead: string;
    basis: string;
  } | null;
  freshness: string | null;
}

export function playerShareCardModel(vm: PlayerProfileVM, now: Date = new Date()): PlayerShareCardModel {
  const valueParts = valueEurParts(vm.valuation.current?.valueEur);
  const name = vm.identity.displayName;
  const meta = [vm.identity.position, vm.club?.name ?? null].filter((s): s is string => !!s).join(" · ");
  const d = heroDelta(vm);
  let delta: PlayerShareCardModel["delta"] = null;
  if (d) {
    const basis = d.direction === "flat" ? "" : ` since ${d.basisMonth}`;
    const lead = d.direction === "flat" ? d.text : d.text.slice(0, d.text.length - basis.length);
    delta = { direction: d.direction, text: d.text, lead, basis };
  }
  return {
    name,
    nameSize: name.length > 20 ? 52 : 64,
    initials: initialsOf(name),
    photoUrl: vm.identity.photoUrl,
    meta: meta || null,
    label: valuationLabel(vm),
    value: valueParts,
    delta: valueParts ? delta : null,
    freshness: valueParts ? freshnessLine(vm, now) : null,
  };
}
