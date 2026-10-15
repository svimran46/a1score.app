"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, MonitorPlay, Shield, Tv } from "lucide-react";
import type { TvListing } from "@/lib/tv/types";
import { groupByLocalDay } from "@/lib/tv/days";
import { TV_COUNTRIES, TV_COUNTRY_STORAGE_KEY, tvCountryName } from "@/lib/tv/countries";
import { formatKickoffTimeOnly } from "@/lib/utils";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { MenuButton, MenuRadioItem } from "@/components/ui/MenuButton";
import { SubPageHeader } from "@/components/more/SubPageHeader";
import { EmptyState } from "@/components/ui";
import { useViewerTimeZone } from "./useViewerTimeZone";

function TeamLine({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <span className="w-6 h-6 shrink-0 flex items-center justify-center">
        {logoUrl ? (
          <Image src={logoUrl} alt="" width={24} height={24} className="object-contain w-6 h-6" unoptimized />
        ) : (
          <Shield aria-hidden="true" className="w-5 h-5 text-[var(--text-muted)]" />
        )}
      </span>
      <span className="truncate text-[15px] text-[var(--text-primary)]">{name}</span>
    </span>
  );
}

function ListingCard({ l, timeZone }: { l: TvListing; timeZone: string }) {
  const time = formatKickoffTimeOnly(l.startTime, timeZone);
  return (
    <li>
      <Link
        href={`/matches/${l.matchId}`}
        className="flex items-stretch gap-4 p-4 rounded-[var(--card-radius)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <span className="w-14 shrink-0 flex flex-col items-center justify-center border-r border-[var(--divider)] pr-4">
          <time dateTime={l.startTime} className="text-base font-semibold tabular-nums text-[var(--text-primary)]">
            {time}
          </time>
          {l.live && (
            <span className="mt-1 text-xs font-semibold text-[var(--live)]">
              Live<span className="sr-only"> broadcast</span>
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block space-y-1.5">
            <TeamLine name={l.home.name} logoUrl={l.home.logoUrl} />
            <TeamLine name={l.away.name} logoUrl={l.away.logoUrl} />
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[var(--text-muted)]">
            {l.channels.map((c) => (
              <span key={c.name} className="inline-flex items-center gap-1">
                {c.kind === "stream" ? (
                  <MonitorPlay aria-hidden="true" className="w-3.5 h-3.5" />
                ) : (
                  <Tv aria-hidden="true" className="w-3.5 h-3.5" />
                )}
                {c.name}
                {c.kind === "stream" && <span className="sr-only"> (streaming)</span>}
              </span>
            ))}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function TvScheduleClient({
  country,
  listings,
  sourceLabel,
  unavailable,
}: {
  country: string;
  listings: TvListing[];
  sourceLabel: string;
  /** The source could not be reached (as opposed to no broadcasts). */
  unavailable: boolean;
}) {
  const router = useRouter();
  const timeZone = useViewerTimeZone();
  const days = useMemo(() => groupByLocalDay(listings, new Date(), timeZone), [listings, timeZone]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = days.find((d) => d.key === activeKey) ?? days[0];

  // Remember the country so More and the next visit open it directly.
  useEffect(() => {
    try {
      window.localStorage.setItem(TV_COUNTRY_STORAGE_KEY, country);
    } catch {
      // Storage blocked: the URL still carries the country.
    }
  }, [country]);

  return (
    <div className="max-w-[720px] mx-auto space-y-4 pb-8">
      <SubPageHeader
        title="TV schedules"
        backHref="/more"
        backLabel="Back to More"
        actions={
          <MenuButton
            ariaLabel={`Country: ${tvCountryName(country)}`}
            buttonClassName="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            label={
              <>
                <Globe aria-hidden="true" className="w-4 h-4" />
                <span className="max-w-[9rem] truncate">{tvCountryName(country)}</span>
              </>
            }
          >
            {TV_COUNTRIES.map((c) => (
              <MenuRadioItem
                key={c.code}
                checked={c.code === country}
                onSelect={() => {
                  if (c.code !== country) router.push(`/tv?country=${c.code}`);
                }}
              >
                {c.name}
              </MenuRadioItem>
            ))}
          </MenuButton>
        }
      />

      {days.length > 0 && active ? (
        <>
          <UnderlineTabs
            idPrefix="tv"
            ariaLabel="Broadcast days"
            tabs={days.map((d) => ({ id: d.key, label: d.label }))}
            activeTab={active.key}
            onChange={setActiveKey}
          />
          <div role="tabpanel" id={`tv-panel-${active.key}`} aria-labelledby={`tv-tab-${active.key}`}>
            <ul className="space-y-3">
              {active.listings.map((l) => (
                <ListingCard key={l.matchId} l={l} timeZone={timeZone} />
              ))}
            </ul>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Tv className="w-6 h-6" />}
          title={unavailable ? "TV listings are unavailable right now" : `No upcoming broadcasts for ${tvCountryName(country)}`}
          message={unavailable ? "Please try again in a few minutes." : "Try another country from the menu above."}
        />
      )}

      <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
        Times are in your timezone. Listings from {sourceLabel}; broadcasters can change their schedules, so check with
        them before kick-off.
      </p>
    </div>
  );
}
