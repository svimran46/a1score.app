"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLeagueSlug } from "@/lib/slugs";
import { useLiveMatchCount } from "@/hooks/useLiveMatchCount";
import { BOTTOM_TABS, MORE_ACCOUNT, MORE_FEATURES, isUnder } from "@/lib/nav/config";
import { NAV_ICONS } from "@/components/shell/navIcons";

export interface LeagueItem {
  id: string;
  name: string;
  country?: string | null;
  slug?: string;
  logoUrl?: string | null;
}

export const DEFAULT_TOP_LEAGUES: LeagueItem[] = [
  { id: "cmuihndux0003b23fizizm4a0", name: "Premier League", country: "England", slug: "premier-league-cmuihndux0003b23fizizm4a0" },
  { id: "cmuihncv70001b23frvqgzdp6", name: "LaLiga", country: "Spain", slug: "laliga-cmuihncv70001b23frvqgzdp6" },
  { id: "cmuihnegb0004b23fhslrse6b", name: "Serie A", country: "Italy", slug: "serie-a-cmuihnegb0004b23fhslrse6b" },
  { id: "cmuihneym0005b23fkpqbo0uj", name: "Bundesliga", country: "Germany", slug: "bundesliga-cmuihneym0005b23fkpqbo0uj" },
  { id: "cmuihnddf0002b23fskdzdx29", name: "Ligue 1", country: "France", slug: "ligue-1-cmuihnddf0002b23fskdzdx29" },
  { id: "cmuihncd80000b23f6khust90", name: "Champions League", country: "Europe", slug: "champions-league-cmuihncd80000b23f6khust90" },
  { id: "cmuihnfy10007b23f3j6km8jo", name: "Liga Portugal", country: "Portugal", slug: "liga-portugal-cmuihnfy10007b23f3j6km8jo" },
  { id: "cmuihnffm0006b23feq78bq1b", name: "Eredivisie", country: "Netherlands", slug: "eredivisie-cmuihnffm0006b23feq78bq1b" },
];

// Desktop mirrors the mobile IA: the four primary tabs, then everything the
// More hub holds, so both layouts reach the same places by the same names.
const SIDEBAR_SECTIONS = [
  {
    title: "Browse",
    links: BOTTOM_TABS.filter((t) => t.key !== "more").map((t) => ({
      name: t.label,
      href: t.href,
      icon: t.icon,
      pulse: t.showsLiveCount,
      isActive: t.isActive,
    })),
  },
  {
    title: "Tools",
    links: MORE_FEATURES.map((f) => ({ name: f.label, href: f.href, icon: f.icon, pulse: false, isActive: (p: string) => isUnder(p, f.href) })),
  },
  {
    title: "Account",
    links: MORE_ACCOUNT.map((f) => ({
      name: f.label,
      href: f.href,
      icon: f.icon,
      pulse: false,
      // Settings stays highlighted on its sub-pages except Notifications, which has its own row.
      isActive: (p: string) => (f.key === "settings" ? isUnder(p, f.href) && !isUnder(p, "/settings/notifications") : isUnder(p, f.href)),
    })),
  },
];

export function LeftRail({ leagues }: { leagues?: LeagueItem[] }) {
  const pathname = usePathname();
  const liveCount = useLiveMatchCount();
  const displayLeagues = leagues && leagues.length > 0 ? leagues.slice(0, 8) : DEFAULT_TOP_LEAGUES;

  return (
    <aside
      aria-label="Sidebar navigation and top leagues"
      className="hidden lg:flex flex-col gap-4 w-[var(--rail-left)] shrink-0"
    >
      {/* Top Leagues Card */}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Top Leagues
          </h2>
          <Link
            href="/leagues"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            All
          </Link>
        </div>

        <nav aria-label="Top Leagues list" className="flex flex-col space-y-1">
          {displayLeagues.map((league) => {
            const slug = league.slug || getLeagueSlug(league);
            const href = `/leagues/${slug}`;
            const isActive = pathname.startsWith(href) || pathname === `/leagues/${league.id}`;

            return (
              <Link
                key={league.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  isActive
                    ? "bg-[var(--bg-chip)] text-[var(--accent)] font-semibold"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
                  <Image
                    src={`/img/league/${league.id}`}
                    alt={league.name}
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate group-hover:text-[var(--accent)] transition-colors">
                    {league.name}
                  </div>
                  {league.country && (
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {league.country}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.title} className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
          <div className="mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {section.title}
            </h2>
          </div>

          <nav aria-label={section.title} className="flex flex-col space-y-1">
            {section.links.map((link) => {
              const Icon = NAV_ICONS[link.icon];
              const isActive = link.isActive(pathname);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                    isActive
                      ? "bg-[var(--bg-chip)] text-[var(--accent)] font-bold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span className="relative flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                    {link.pulse && liveCount !== null && liveCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--live)]" />
                    )}
                  </span>
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
