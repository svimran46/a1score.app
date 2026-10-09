import type { PlayerProfileVM } from "@/lib/data/playerProfile.types";
import { isMajorHonour, type PlayerAchievementItem } from "@/lib/data/playerAchievements";
import { formatCount } from "@/lib/format-value";
import { ProfileSection, ProfileDisclosure } from "./ProfileSection";
import { PlayerAchievements } from "./PlayerAchievements";

/** Above this many honours the full grouped grid moves behind a disclosure. */
export const HONOURS_INLINE_MAX = 5;

/** Major honours first, then by title count, then by name for a stable order. */
export function rankHonours(items: PlayerAchievementItem[]): PlayerAchievementItem[] {
  return [...items].sort((a, b) => {
    const major = Number(isMajorHonour(b)) - Number(isMajorHonour(a));
    if (major !== 0) return major;
    if (b.titleCount !== a.titleCount) return b.titleCount - a.titleCount;
    return a.competitionName.localeCompare(b.competitionName);
  });
}

function HonourRow({ item, wideOnly }: { item: PlayerAchievementItem; wideOnly: boolean }) {
  const seasons = item.seasons.join(" · ");
  return (
    <li className={`min-w-0 py-2 ${wideOnly ? "hidden @[560px]/profile:block" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-medium leading-[22px] text-text-primary">
          {item.competitionName}
        </span>
        <span className="shrink-0 text-[15px] font-semibold tabular-nums text-text-primary">
          <span aria-hidden="true">×{item.titleCount}</span>
          <span className="sr-only">
            {item.titleCount} {item.titleCount === 1 ? "title" : "titles"}
          </span>
        </span>
      </div>
      {seasons ? <p className="truncate text-xs leading-4 text-text-muted tabular-nums">{seasons}</p> : null}
    </li>
  );
}

/** Honours (#honours): hidden when no titles are on record. */
export function HonoursSection({ vm }: { vm: PlayerProfileVM }) {
  const honours = vm.honours;
  if (!honours || honours.totalTitles <= 0 || honours.all.length === 0) return null;

  const ranked = rankHonours(honours.all);
  const inline = ranked.length <= HONOURS_INLINE_MAX;
  // Top 4 on narrow containers, top 6 from 560px; everything when the list is short.
  const top = inline ? ranked : ranked.slice(0, 6);
  const total = honours.totalTitles;

  return (
    <ProfileSection
      id="honours"
      navLabel="Honours"
      meta={<span className="tabular-nums">{formatCount(total)} {total === 1 ? "title" : "titles"}</span>}
    >
      <ul className="grid grid-cols-1 gap-x-6 divide-y divide-divider/60 @[560px]/profile:grid-cols-2 @[560px]/profile:divide-y-0">
        {top.map((item, i) => (
          <HonourRow key={`${item.kind}-${item.competitionKey}`} item={item} wideOnly={!inline && i >= 4} />
        ))}
      </ul>
      {!inline ? (
        <ProfileDisclosure className="mt-2" summary={`All honours (${ranked.length})`}>
          <div className="pt-2">
            <PlayerAchievements achievements={honours} playerName={vm.identity.displayName} />
          </div>
        </ProfileDisclosure>
      ) : null}
    </ProfileSection>
  );
}
