import type { MoneyContext } from "./currency";
import { formatCompactEur, formatEur } from "./utils";
import { describeDelta, formatAxisEur, formatSignedEur, formatValueEur, spokenEur, valueEurParts } from "./format-value";

/**
 * The euro formatters bound to one display currency. Every function still
 * takes euros; the binding converts. Use via `useMoney()` in client code.
 */
export function bindMoney(ctx: MoneyContext) {
  return {
    ctx,
    /** True when figures are converted from euros (not the source currency). */
    isConverted: ctx.code !== "EUR",
    compact: (eur: number | bigint | null | undefined) => formatCompactEur(eur, ctx),
    full: (eur: number | bigint | null | undefined) => formatEur(eur, ctx),
    value: (eur: number | null | undefined) => formatValueEur(eur, ctx),
    parts: (eur: number | null | undefined) => valueEurParts(eur, ctx),
    axis: (eur: number) => formatAxisEur(eur, ctx),
    signed: (eur: number) => formatSignedEur(eur, ctx),
    spoken: (eur: number) => spokenEur(eur, ctx),
    delta: (d: Parameters<typeof describeDelta>[0]) => describeDelta(d, ctx),
  };
}

export type BoundMoney = ReturnType<typeof bindMoney>;
