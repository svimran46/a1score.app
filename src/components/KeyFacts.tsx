import React from "react";
import { Card } from "@/components/ui";
import type { PlayerProfileVM } from "@/lib/data/playerProfile.types";
import { formatDateGB } from "@/lib/format-value";
import { ProfileSection } from "@/components/players/ProfileSection";

export interface KeyFactItem {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}

interface KeyFactsProps {
  items: KeyFactItem[];
  className?: string;
}

/**
 * a1score KeyFacts Component:
 * - A definition list inside a single card container.
 * - Each row 48px: label left (13/400 secondary), value right (15/500 text).
 * - No borders on card, uses design tokens.
 * - Missing data: HIDE the field. If more than half is missing, hide the whole block.
 */
export function KeyFacts({ items, className = "" }: KeyFactsProps) {
  // Filter out items with missing/empty/placeholder values
  const validItems = items.filter((item) => {
    if (item.value === null || item.value === undefined) return false;
    if (typeof item.value === "string") {
      const trimmed = item.value.trim().toLowerCase();
      if (!trimmed) return false;
      if (
        trimmed === "n/a" ||
        trimmed === "unknown" ||
        trimmed === "no data yet" ||
        trimmed === "pending" ||
        trimmed === "-" ||
        trimmed === "--" ||
        trimmed === "tbd"
      ) {
        return false;
      }
    }
    return true;
  });

  // If more than half of items are missing, or no valid items, hide the whole block
  if (validItems.length === 0 || validItems.length < items.length / 2) {
    return null;
  }

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      <dl className="divide-y divide-[var(--divider)]">
        {validItems.map((item, idx) => (
          <div
            key={item.label || idx}
            className="h-12 min-h-[48px] px-4 flex items-center justify-between gap-4"
          >
            <dt className="text-xs sm:text-[13px] font-medium text-[var(--text-muted)] shrink-0">
              {item.label}
            </dt>
            <dd className="text-sm font-semibold text-[var(--text-primary)] text-right min-w-0 tabular-nums truncate">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Reference facts that the hero does not already show; each row is omitted when unknown. */
export function profileFacts(vm: PlayerProfileVM): { label: string; value: string }[] {
  const id = vm.identity;
  const born = formatDateGB(id.dob);
  const full = id.fullName?.trim();
  const rows: { label: string; value: string | null }[] = [
    { label: "Born", value: born || null },
    { label: "Height", value: id.heightCm != null && id.heightCm > 0 ? `${id.heightCm} cm` : null },
    { label: "Foot", value: id.preferredFoot?.trim() ? capitalise(id.preferredFoot.trim()) : null },
    { label: "Nationality", value: id.nationality?.trim() || null },
    { label: "Full name", value: full && full !== id.displayName.trim() ? full : null },
    { label: "Also plays", value: id.alsoPlays?.trim() || null },
  ];
  return rows.filter((r): r is { label: string; value: string } => !!r.value);
}

/** Profile (#profile): hidden when fewer than two facts are on record. */
export function ProfileFactsSection({ vm }: { vm: PlayerProfileVM }) {
  const facts = profileFacts(vm);
  if (facts.length < 2) return null;
  return (
    <ProfileSection id="profile" navLabel="Profile">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 @[560px]/profile:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-xs font-medium leading-4 text-text-muted">{f.label}</dt>
            <dd className="mt-0.5 break-words text-[15px] font-medium leading-[22px] text-text-primary">{f.value}</dd>
          </div>
        ))}
      </dl>
    </ProfileSection>
  );
}
