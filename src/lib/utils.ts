import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEur(amount: number | bigint | null | undefined): string {
  if (amount == null) return "N/A";
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (typeof num !== "number" || isNaN(num)) return "N/A";
  if (num === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `€${num}`;
  }
}

export function formatCompactEur(amount: number | bigint | null | undefined): string {
  if (amount == null) return "N/A";
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (typeof num !== "number" || isNaN(num)) return "N/A";
  if (num === 0) return "Free";
  
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const prefix = isNegative ? "-€" : "€";

  if (abs >= 999_950_000) {
    const val = (abs / 1_000_000_000).toFixed(1);
    return `${prefix}${val.endsWith('.0') ? val.slice(0, -2) : val}B`;
  }
  if (abs >= 999_500) {
    const val = (abs / 1_000_000).toFixed(1);
    return `${prefix}${val.endsWith('.0') ? val.slice(0, -2) : val}M`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(abs / 1_000).toFixed(0)}k`;
  }
  return `${prefix}${abs}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Formats data age: "Updated 5 Jun 2026" or "Updated 4 months ago" if older than 30 days
 */
export function formatUpdateAge(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return `Updated ${formatDate(d)}`;
    }
    const months = Math.max(1, Math.floor(diffDays / 30.44));
    if (months < 12) {
      return `Updated ${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.max(1, Math.floor(diffDays / 365.25));
    return `Updated ${years} ${years === 1 ? "year" : "years"} ago`;
  } catch {
    return "";
  }
}

export function calculateAge(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  try {
    const birth = typeof dob === "string" ? new Date(dob) : dob;
    if (!birth || isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age <= 120 ? age : null;
  } catch {
    return null;
  }
}

export interface FormatKickoffOptions {
  tz?: string;
  includeDate?: boolean;
}

export function formatKickoff(
  date: Date | string | number | null | undefined,
  options: FormatKickoffOptions = {}
): string {
  if (!date) return "TBD";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "TBD";

  const tz = options.tz || "UTC";

  try {
    if (options.includeDate) {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
        timeZoneName: "short",
      }).format(d);
    }

    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(d);
  } catch {
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${mins} UTC`;
  }
}

export function formatKickoffTimeOnly(
  date: Date | string | number | null | undefined,
  tz?: string
): string {
  if (!date) return "TBD";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "TBD";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz || "UTC",
    }).format(d);
  } catch {
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  }
}

