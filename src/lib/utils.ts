import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEur(amount: number | bigint | null | undefined): string {
  if (amount == null) return "N/A";
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (num === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactEur(amount: number | bigint | null | undefined): string {
  if (amount == null) return "N/A";
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (num === 0) return "Free";
  
  if (num >= 1_000_000_000) {
    return `€${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1);
    return `€${val.endsWith('.0') ? val.slice(0, -2) : val}M`;
  }
  if (num >= 1_000) {
    return `€${(num / 1_000).toFixed(0)}k`;
  }
  return `€${num}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function calculateAge(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
