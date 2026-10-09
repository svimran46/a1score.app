import React from "react";
import type { PlayerProfileVM, ProfileInjury } from "@/lib/data/playerProfile.types";
import { formatDateGB } from "@/lib/format-value";
import { ProfileDisclosure, ProfileSection } from "@/components/players/ProfileSection";

export const INJURIES_VISIBLE = 3;

function InjuryRow({ injury }: { injury: ProfileInjury }) {
  // Start dates are trusted from our own records only.
  const since = injury.source === "db" && injury.since ? formatDateGB(injury.since) : "";
  return (
    <li className="border-b border-divider/60 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 truncate text-sm font-medium leading-5 text-text-primary">{injury.type}</p>
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-bg-chip px-2 text-xs font-medium text-text-secondary">
          {injury.isActive ? "Out" : "Returned"}
        </span>
      </div>
      {since || injury.expectedReturn ? (
        <p className="mt-0.5 text-xs leading-4 text-text-muted">
          {since ? `Since ${since}` : null}
          {since && injury.expectedReturn ? <span aria-hidden="true">{" · "}</span> : null}
          {injury.expectedReturn ? `Expected return: ${injury.expectedReturn}` : null}
        </p>
      ) : null}
    </li>
  );
}

function InjuryList({ rows }: { rows: ProfileInjury[] }) {
  return (
    <ul className="list-none">
      {rows.map((injury) => (
        <InjuryRow key={injury.id} injury={injury} />
      ))}
    </ul>
  );
}

/** Injuries (#injuries): sourced records only, neutral tags, hidden when there are none. */
export function InjuriesSection({ vm }: { vm: PlayerProfileVM }) {
  const injuries = vm.injuries ?? [];
  if (injuries.length === 0) return null;
  const visible = injuries.slice(0, INJURIES_VISIBLE);
  const more = injuries.slice(INJURIES_VISIBLE);

  return (
    <ProfileSection id="injuries" navLabel="Injuries">
      <InjuryList rows={visible} />
      {more.length > 0 ? (
        <ProfileDisclosure
          summary={`${more.length} more ${more.length === 1 ? "injury" : "injuries"}`}
          className="border-t border-divider/60"
        >
          <InjuryList rows={more} />
        </ProfileDisclosure>
      ) : null}
    </ProfileSection>
  );
}
