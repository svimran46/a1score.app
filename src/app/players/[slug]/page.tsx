import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { calculateAge, formatCompactEur, formatDate, formatUpdateAge } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";
import { getClubSlug } from "@/lib/slugs";
import { constructMetadata } from "@/lib/metadata";
import { Card } from "@/components/ui";
import { PlayerTabsContainer } from "@/components/PlayerTabsContainer";
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

  // Change computation with trend arrow + %
  const currentVal = player.latestMarketValue || latestValuation?.valueEur || 0;
  let changeElement: React.ReactNode = null;
  if (prevValuation && prevValuation.valueEur > 0 && currentVal > 0) {
    const diff = currentVal - prevValuation.valueEur;
    if (diff !== 0) {
      const isPos = diff > 0;
      const trendSymbol = isPos ? "▲" : "▼";
      const sign = isPos ? "+" : "−";
      const absDiff = Math.abs(diff);
      const pct = Math.abs((diff / prevValuation.valueEur) * 100).toFixed(1);
      const trendColorClass = isPos ? "text-[var(--trend-positive)]" : "text-[var(--trend-negative)]";

      changeElement = (
        <div className={`flex items-center gap-1 text-xs font-bold tabular-nums ${trendColorClass}`}>
          <span>{trendSymbol}</span>
          <span>{`${sign}${pct}%`}</span>
          <span className="text-[var(--text-muted)] font-normal ml-0.5">
            ({sign}{formatCompactEur(absDiff)})
          </span>
        </div>
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

  // KeyFacts items
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
    <div className="space-y-4 max-w-[720px] mx-auto">
      {/* 1. Header Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar + Player Metadata */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 bg-[var(--bg-chip)]">
              <EntityImage
                src={player.photoUrl}
                alt={player.fullName || "Player"}
                fill
                sizes="80px"
                entityType="player"
                priority
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>{player.position || "Footballer"}</span>
                {nationalityText && (
                  <>
                    <span>•</span>
                    <span>{nationalityText}</span>
                  </>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight truncate mt-0.5">
                {player.fullName}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)] mt-1 truncate">
                {currentClub && (
                  <Link
                    href={`/clubs/${getClubSlug(currentClub)}`}
                    className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors truncate"
                  >
                    {currentClub.logoUrl && (
                      <span className="relative w-4 h-4 shrink-0 inline-block overflow-hidden">
                        <EntityImage
                          src={currentClub.logoUrl}
                          alt=""
                          fill
                          sizes="16px"
                          entityType="club"
                          className="object-contain"
                        />
                      </span>
                    )}
                    <span className="font-semibold">{clubShort}</span>
                  </Link>
                )}
                {clubShort && age && <span>•</span>}
                {age && <span>{age} yrs</span>}
              </div>
            </div>
          </div>

          {/* Current Market Value large in amber with trend arrow + % */}
          {currentVal > 0 && (
            <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-elevated)] flex flex-col sm:items-end justify-center shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Current Market Value
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[var(--value-text)] tabular-nums tracking-tight mt-0.5">
                {formatCompactEur(currentVal)}
              </div>
              {changeElement && <div className="mt-1">{changeElement}</div>}
              {updateAgeText && (
                <span className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
                  {updateAgeText}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 2. Tabs: Overview, Transfers, Value history */}
      <PlayerTabsContainer
        keyFactsItems={keyFactsItems}
        mvs={mvs}
        playerName={player.fullName}
        dateOfBirth={validDob}
        seasonStats={player.seasonStats}
        transfers={player.transfers}
        injuries={player.injuries}
      />
    </div>
  );
}
