import { formatCompactEur } from "@/lib/utils";
import { formatValueEur } from "@/lib/format-value";
import { parseEurValue } from "@/lib/transfermarkt/parse";
import type { FeeStatus } from "@/lib/data/playerProfile.types";

/**
 * Pure function to detect internal youth/academy moves
 * e.g. "Barça U16" -> "Barça U19", "Real Madrid Castilla", "Juvenil A"
 */
export function isYouthMove(
  fromClubName?: string | null,
  toClubName?: string | null,
  transferType?: string | null
): boolean {
  const youthRegex =
    /(\bU\d{2}\b|\bYouth\b|\bYth\.?\b|\bJuvenil\b|\bSub-\d{2}\b|\bCastilla\b|\bAtlètic\b|\bB-Team\b|\bReserves\b|\bAcademy\b|\bPrimavera\b|\bJgd\.?\b|\bII\b|\bB\b)/i;

  const isFromYouth = !!fromClubName && youthRegex.test(fromClubName);
  const isToYouth = !!toClubName && youthRegex.test(toClubName);

  return isFromYouth || isToYouth;
}

/**
 * Pure function to format transfer fees without ambiguous "Free / Undisclosed"
 */
export function formatTransferFee(
  feeEur?: number | null,
  transferType?: string | null
): { label: string; isAmount: boolean } {
  if (typeof feeEur === "number" && feeEur > 0) {
    return { label: formatCompactEur(feeEur), isAmount: true };
  }

  const tType = transferType?.toLowerCase() || "";
  if (tType.includes("loan")) {
    return { label: "Loan", isAmount: false };
  }

  if (tType.includes("free") || feeEur === 0) {
    return { label: "Free Transfer", isAmount: false };
  }

  return { label: "Undisclosed", isAmount: false };
}

const FEE_STATUSES: readonly FeeStatus[] = [
  "disclosed",
  "loan",
  "loan_fee",
  "loan_return",
  "free",
  "undisclosed",
  "not_recorded",
];

export function isFeeStatus(value: unknown): value is FeeStatus {
  return typeof value === "string" && (FEE_STATUSES as readonly string[]).includes(value);
}

/**
 * Fee status from a raw Transfermarkt fee string. Only an explicit
 * "free transfer" is free; "?" is undisclosed and "-" or "" is not recorded.
 */
export function feeStatusFromTmFee(rawFee: string | null | undefined): { feeStatus: FeeStatus; feeEur: number | null } {
  const raw = (rawFee ?? "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();
  const amount = parseEurValue(raw);

  if (!lower || lower === "-" || lower === "–" || lower === "—") return { feeStatus: "not_recorded", feeEur: null };
  if (lower.includes("free transfer") || lower === "free") return { feeStatus: "free", feeEur: null };
  if (lower.includes("end of loan")) return { feeStatus: "loan_return", feeEur: null };
  if (lower.includes("loan fee") && amount > 0) return { feeStatus: "loan_fee", feeEur: amount };
  if (lower.includes("loan")) return { feeStatus: "loan", feeEur: null };
  if (lower === "?" || lower.includes("?")) return { feeStatus: "undisclosed", feeEur: null };
  if (amount > 0) return { feeStatus: "disclosed", feeEur: amount };
  return { feeStatus: "not_recorded", feeEur: null };
}

/** DB (dataset) rows only carry a numeric fee: > 0 is disclosed, anything else is not recorded. */
export function feeStatusFromDb(feeEur: number | string | bigint | null | undefined): FeeStatus {
  const n = typeof feeEur === "bigint" ? Number(feeEur) : Number(feeEur);
  return Number.isFinite(n) && n > 0 ? "disclosed" : "not_recorded";
}

/**
 * The one place a transfer fee becomes a label. "Free transfer" appears only
 * when the source said so; unknown fees never read as free.
 */
export function formatFeeLabel(
  feeStatus: FeeStatus,
  feeEur: number | null
): { label: string; isAmount: boolean; srLabel?: string } {
  const amount = formatValueEur(feeEur);
  switch (feeStatus) {
    case "disclosed":
      return amount ? { label: amount, isAmount: true } : { label: "—", isAmount: false, srLabel: "No fee recorded" };
    case "loan_fee":
      return amount ? { label: `Loan, ${amount} fee`, isAmount: false } : { label: "Loan", isAmount: false };
    case "loan":
      return { label: "Loan", isAmount: false };
    case "loan_return":
      return { label: "End of loan", isAmount: false };
    case "free":
      return { label: "Free transfer", isAmount: false };
    case "undisclosed":
      return { label: "Fee undisclosed", isAmount: false };
    case "not_recorded":
    default:
      return { label: "—", isAmount: false, srLabel: "No fee recorded" };
  }
}
