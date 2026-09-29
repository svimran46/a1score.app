import { formatCompactEur } from "@/lib/utils";

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
    /(\bU\d{2}\b|\bYouth\b|\bYth\.?\b|\bJuvenil\b|\bSub-\d{2}\b|\bCastilla\b|\bAtlètic\b|\bB-Team\b|\bReserves\b|\bAcademy\b|\bPrimavera\b|\bJgd\.?\b)/i;

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
