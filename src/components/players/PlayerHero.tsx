import React from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { EntityImage } from "@/components/EntityImage";
import { FollowButton } from "@/components/watchlist/FollowButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { formatMonthYear } from "@/lib/format-value";
import type { PlayerProfileVM, ProfileClubRef } from "@/lib/data/playerProfile.types";
import { ValueFigure } from "./ValueFigure";
import { TrendDelta } from "./TrendDelta";
import { contractLeftLine, freshnessLine, heroDelta, valuationLabel } from "./playerCardModel";

export interface PlayerHeroProps {
  vm: PlayerProfileVM;
  /** Absolute canonical profile URL (no hash), used by Share. */
  canonicalUrl: string;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card";

// Inline links keep their text size but get a 44px tall hit area.
const INLINE_LINK = `relative rounded-sm hover:underline before:absolute before:-inset-y-3 before:inset-x-0 before:content-[''] ${FOCUS_RING}`;

const CHIP = `inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-bg-chip px-2 text-sm font-semibold text-text-primary hover:bg-bg-hover @[560px]/profile:px-3 ${FOCUS_RING}`;

// Below a 340px container (a 320px phone) Compare and Share become icon-only.
const NARROW_LABEL = "sr-only @[340px]/profile:not-sr-only";

function ClubLink({ club, className = "" }: { club: ProfileClubRef; className?: string }) {
  return club.href ? (
    <Link href={club.href} className={`${INLINE_LINK} ${className}`}>
      {club.shortName}
    </Link>
  ) : (
    <span className={className}>{club.shortName}</span>
  );
}

function MetaLine({ vm }: { vm: PlayerProfileVM }) {
  const club = vm.club;
  const league = club?.league ?? null;
  const segments: { key: string; node: React.ReactNode; className?: string }[] = [];

  if (vm.identity.position) segments.push({ key: "position", node: vm.identity.position });
  if (club) {
    segments.push({
      key: "club",
      node: (
        <>
          {club.logoUrl && (
            <span aria-hidden="true" className="relative mr-1 inline-block size-4 overflow-hidden align-[-3px]">
              <EntityImage src={club.logoUrl} alt="" fill sizes="16px" entityType="club" className="object-contain" />
            </span>
          )}
          <ClubLink club={club} />
        </>
      ),
    });
  }
  if (league) {
    segments.push({
      key: "league",
      className: "hidden @[560px]/profile:inline",
      node: league.href ? (
        <Link href={league.href} className={INLINE_LINK}>
          {league.name}
        </Link>
      ) : (
        league.name
      ),
    });
  }
  if (vm.identity.age != null) segments.push({ key: "age", node: `Age ${vm.identity.age}` });
  if (vm.status.activeInjury) segments.push({ key: "injured", node: "Injured" });

  if (segments.length === 0) return null;

  return (
    <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-text-secondary @[560px]/profile:text-sm">
      {segments.map((s, i) => (
        <span key={s.key} className={s.className}>
          {i > 0 && (
            <span aria-hidden="true" className="text-text-muted">
              {" · "}
            </span>
          )}
          {s.node}
        </span>
      ))}
    </p>
  );
}

function StatusBlock({ vm }: { vm: PlayerProfileVM }) {
  const { status } = vm;
  let label: string;
  let value: React.ReactNode;
  let extra: string | null = null;

  if (status.kind === "signed" && status.contractUntil) {
    const until = formatMonthYear(status.contractUntil);
    if (!until) return null;
    label = "Contract";
    value = <span className="tabular-nums">{until}</span>;
    extra = contractLeftLine(status.contractMonthsLeft);
  } else if (status.kind === "on_loan" && status.parentClub) {
    label = "On loan from";
    value = <ClubLink club={status.parentClub} />;
  } else if (status.kind === "free_agent") {
    label = "Status";
    value = "Free agent";
  } else if (status.kind === "retired") {
    label = "Status";
    value = "Retired";
  } else {
    return null;
  }

  return (
    <div className="ml-auto mt-1 text-right @[560px]/profile:border-l @[560px]/profile:border-divider @[560px]/profile:pl-5">
      <p className="text-xs leading-4 text-text-muted">{label}</p>
      <p className="text-sm font-semibold leading-5 text-text-primary">{value}</p>
      {extra && <p className="hidden text-xs leading-4 text-text-muted @[560px]/profile:block">{extra}</p>}
    </div>
  );
}

function PriceBand({ vm }: { vm: PlayerProfileVM }) {
  const current = vm.valuation.current;
  const label = valuationLabel(vm);

  if (!current || !(current.valueEur > 0)) {
    return (
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 @[560px]/profile:gap-x-5">
        <p className="text-[15px] leading-5 text-text-muted">No market value on record</p>
        <StatusBlock vm={vm} />
      </div>
    );
  }

  const delta = heroDelta(vm);

  return (
    <>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 @[560px]/profile:gap-x-5">
        <ValueFigure eur={current.valueEur} size="hero" srLabel={label} />
        <div className="mt-1">
          <p aria-hidden="true" className="text-xs font-medium leading-4 text-text-muted">
            {label}
          </p>
          <p className="text-xs leading-4 text-text-muted tabular-nums">{freshnessLine(vm)}</p>
        </div>
        <StatusBlock vm={vm} />
      </div>
      {delta && vm.valuation.sincePrevious && (
        <p className="mt-1.5">
          <TrendDelta delta={vm.valuation.sincePrevious} size="hero" basis="since" />
        </p>
      )}
    </>
  );
}

/**
 * The profile header: identity, then the market value as the page's single
 * bold figure, then the actions. Server-rendered; FollowButton and
 * ShareButton are the only client islands. One DOM tree at every width: the
 * @container/profile classes move the actions into the identity row at 560px.
 */
export function PlayerHero({ vm, canonicalUrl }: PlayerHeroProps) {
  const { identity } = vm;
  const name = identity.displayName;

  return (
    <header
      id="profile-hero"
      aria-labelledby="player-name"
      className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3 rounded-[var(--card-radius)] bg-bg-card p-3 @[560px]/profile:grid-cols-[64px_minmax(0,1fr)_auto] @[560px]/profile:gap-x-4 @[560px]/profile:p-5"
    >
      <span
        aria-hidden="true"
        className="relative col-start-1 row-start-1 size-14 overflow-hidden rounded-full bg-bg-chip @[560px]/profile:size-16"
      >
        <EntityImage
          src={identity.photoUrl}
          alt=""
          fill
          sizes="64px"
          priority
          entityType="player"
          className="object-cover"
        />
      </span>

      <div className="col-start-2 row-start-1 min-w-0 @[560px]/profile:col-end-4">
        <h1
          id="player-name"
          title={identity.fullName && identity.fullName !== name ? identity.fullName : undefined}
          className="line-clamp-2 text-[24px] font-extrabold leading-7 text-text-primary @[560px]/profile:text-[32px] @[560px]/profile:leading-9"
        >
          {name}
        </h1>
        <MetaLine vm={vm} />
      </div>

      <div className="col-span-full row-start-2 mt-3 min-w-0 @[560px]/profile:col-span-2 @[560px]/profile:mt-5">
        <PriceBand vm={vm} />
      </div>

      <div className="col-span-full row-start-3 mt-3 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 @[340px]/profile:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] @[560px]/profile:col-span-1 @[560px]/profile:col-start-3 @[560px]/profile:row-start-2 @[560px]/profile:mt-5 @[560px]/profile:flex @[560px]/profile:self-end">
        <FollowButton
          variant="chip"
          id={identity.key}
          type="player"
          name={name}
          slug={identity.slug}
          avatarUrl={identity.photoUrl}
          clubName={vm.club?.shortName ?? null}
          clubCrest={vm.club?.logoUrl ?? null}
          position={identity.position}
          marketValue={vm.valuation.current?.valueEur ?? null}
          className="@[560px]/profile:min-w-[7.5rem]"
        />
        <Link
          href={`/compare?players=${encodeURIComponent(identity.slug)}`}
          className={CHIP}
        >
          <Scale aria-hidden="true" className="size-4 shrink-0 text-text-muted" />
          <span className={NARROW_LABEL}>Compare</span>
          <span className="sr-only">{` ${name} with other players`}</span>
        </Link>
        <ShareButton
          variant="chip"
          title={`${name}: market value and transfers`}
          url={canonicalUrl}
          labelClassName={NARROW_LABEL}
        />
      </div>
    </header>
  );
}
