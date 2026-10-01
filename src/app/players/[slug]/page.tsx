import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { MarketValueChart } from "@/components/MarketValueChart";
import { TransfersTable } from "@/components/TransfersTable";
import { StatsTable } from "@/components/StatsTable";
import { InjuriesTable } from "@/components/InjuriesTable";
import { KeyFacts } from "@/components/KeyFacts";
import { SectionHeader } from "@/components/SectionHeader";
import { calculateAge, formatCompactEur, formatDate, formatUpdateAge } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";
import { getClubSlug } from "@/lib/slugs";
import { constructMetadata, SITE_URL } from "@/lib/metadata";

import type { Metadata } from "next";

export const revalidate = 3600; // ISR revalidation every hour
export const runtime = "edge";

interface PlayerPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const player = await getPlayerBySlugOrId(params.slug);
  if (!player) {
    return constructMetadata({
      title: "Player Not Found",
      description: "The requested football player profile could not be located.",
      path: `/players/${params.slug}`,
    });
  }

  const formattedVal = player.latestMarketValue
    ? formatCompactEur(player.latestMarketValue)
    : "";
  const clubName = player.currentClub?.name || "Free Agent";
  const displayName = player.fullName || "Player Profile";
  const displayPos = player.position || "Footballer";

  return constructMetadata({
    title: `${displayName} — Market Value (${formattedVal}), Stats & Transfers`,
    description: `${displayName} (${displayPos}) playing for ${clubName}. Current market valuation: ${formattedVal}. Career transfer history, documented season statistics, and valuation evolution chart on a1score.app.`,
    path: `/players/${params.slug}`,
    image: player.photoUrl || undefined,
  });
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayerBySlugOrId(params.slug);

  if (!player) {
    notFound();
  }

  const age = calculateAge(player.dateOfBirth);
  const mvs = Array.isArray(player.marketValues) ? player.marketValues : [];
  const latestValuation = mvs.length > 0 ? mvs[mvs.length - 1] : undefined;
  const prevValuation = mvs.length > 1 ? mvs[mvs.length - 2] : undefined;

  const rawClub = player.currentClub;
  const currentClub = Array.isArray(rawClub) ? rawClub[0] || null : rawClub || null;
  const clubShort = currentClub ? getClubShortName(currentClub.shortName || currentClub.name || "") : null;

  const validDob =
    player.dateOfBirth && !isNaN(new Date(player.dateOfBirth).getTime())
      ? new Date(player.dateOfBirth)
      : null;

  // Change computation
  const currentVal = player.latestMarketValue || latestValuation?.valueEur || 0;
  let changeLine: React.ReactNode = null;
  if (prevValuation && prevValuation.valueEur > 0 && currentVal > 0) {
    const diff = currentVal - prevValuation.valueEur;
    if (diff !== 0) {
      const isPos = diff > 0;
      const sign = isPos ? "+" : "−"; // true minus sign \u2212
      const absDiff = Math.abs(diff);
      const pct = Math.abs((diff / prevValuation.valueEur) * 100).toFixed(1);
      changeLine = (
        <span
          className="text-[13px] font-medium leading-none"
          style={{ color: isPos ? "var(--color-positive)" : "var(--color-negative)" }}
        >
          {`${sign}${formatCompactEur(absDiff)} (${sign}${pct}%) since previous update`}
        </span>
      );
    }
  }

  // Update age
  const updateAgeText = formatUpdateAge(latestValuation?.date || player.updatedAt);

  // Nationality
  const nationalityText =
    Array.isArray(player.nationality) && player.nationality.length > 0
      ? player.nationality.join(", ")
      : typeof player.nationality === "string" && player.nationality
      ? player.nationality
      : null;

  // KeyFacts items (hide unknown/null)
  const keyFactsItems = [
    {
      label: "Age",
      value: age ? `${age} (${validDob ? formatDate(validDob) : ""})`.trim() : null,
    },
    {
      label: "Nationality",
      value: nationalityText,
    },
    {
      label: "Height",
      value: player.heightCm ? `${player.heightCm} cm` : null,
    },
    {
      label: "Foot",
      value: player.preferredFoot || null,
    },
    {
      label: "Contract",
      value: player.contractUntil ? formatDate(player.contractUntil) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header: photo 72px, name (title 20/600), club crest + short name, age. Nothing else. */}
      <header className="flex items-center gap-4 py-1">
        <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 border border-white/5 bg-slate-800/80">
          <EntityImage
            src={player.photoUrl}
            alt={player.fullName || "Player"}
            width={72}
            height={72}
            entityType="player"
            priority
            className="object-cover w-full h-full"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1
            className="text-[20px] font-semibold leading-tight line-clamp-2"
            style={{ color: "var(--color-text)" }}
          >
            {player.fullName}
          </h1>

          <div
            className="flex items-center gap-2 text-[13px] font-normal mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {currentClub && (
              <Link
                href={`/clubs/${getClubSlug(currentClub)}`}
                className="flex items-center gap-1.5 hover:underline"
              >
                {currentClub.logoUrl && (
                  <span className="relative w-3.5 h-3.5 shrink-0 inline-block overflow-hidden">
                    <EntityImage
                      src={currentClub.logoUrl}
                      alt=""
                      width={14}
                      height={14}
                      entityType="club"
                      className="object-contain w-3.5 h-3.5"
                    />
                  </span>
                )}
                <span>{clubShort}</span>
              </Link>
            )}
            {clubShort && age && <span>·</span>}
            {age && <span>{age} yrs</span>}
          </div>
        </div>
      </header>

      {/* 2. Value block (one card): display number 28/600 in gold, left-aligned; under it change as one line; Updated X ago in secondary. */}
      {currentVal > 0 && (
        <div
          className="rounded-[12px] p-4 flex flex-col items-start gap-1 overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderWidth: "1px",
          }}
        >
          <div
            className="text-[28px] font-semibold tabular-nums leading-tight"
            style={{ color: "var(--color-accent)" }}
          >
            {formatCompactEur(currentVal)}
          </div>
          {changeLine && <div className="mt-0.5">{changeLine}</div>}
          {updateAgeText && (
            <div
              className="text-[13px] font-normal mt-0.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {updateAgeText}
            </div>
          )}
        </div>
      )}

      {/* 3. Section "Value history": one line chart with peak marked and caption "Peak €180M". */}
      {mvs.length > 0 && (
        <section>
          <SectionHeader title="Value history" />
          <MarketValueChart
            data={mvs}
            playerName={player.fullName}
            dateOfBirth={validDob}
          />
        </section>
      )}

      {/* 4. Section "Key facts": KeyFacts rows */}
      <section>
        <SectionHeader title="Key facts" />
        <KeyFacts items={keyFactsItems} />
      </section>

      {/* 5. Section "Season stats": shown only when data exists */}
      {Array.isArray(player.seasonStats) && player.seasonStats.length > 0 && (
        <section>
          <SectionHeader title="Season stats" />
          <div
            className="rounded-[12px] p-4 overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderWidth: "1px",
            }}
          >
            <StatsTable stats={player.seasonStats} />
          </div>
        </section>
      )}

      {/* Transfers (shown only when data exists) */}
      {Array.isArray(player.transfers) && player.transfers.length > 0 && (
        <section>
          <SectionHeader title="Transfers" />
          <div
            className="rounded-[12px] p-4 overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderWidth: "1px",
            }}
          >
            <TransfersTable transfers={player.transfers} />
          </div>
        </section>
      )}

      {/* Injuries (shown only when data exists) */}
      {Array.isArray(player.injuries) && player.injuries.length > 0 && (
        <section>
          <SectionHeader title="Injuries" />
          <div
            className="rounded-[12px] p-4 overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderWidth: "1px",
            }}
          >
            <InjuriesTable injuries={player.injuries} />
          </div>
        </section>
      )}
    </div>
  );
}
