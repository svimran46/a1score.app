"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLeagueSlug } from "@/lib/slugs";
import { DEFAULT_TOP_LEAGUES, LeagueItem } from "./LeftRail";

export function TabletLeaguesScroller({ leagues }: { leagues?: LeagueItem[] }) {
  const pathname = usePathname();
  const displayLeagues = leagues && leagues.length > 0 ? leagues.slice(0, 8) : DEFAULT_TOP_LEAGUES;

  return (
    <nav
      aria-label="Top Leagues quick selector"
      className="hidden sm:flex lg:hidden w-full overflow-x-auto no-scrollbar py-1 mb-4 items-center gap-2"
    >
      {displayLeagues.map((league) => {
        const slug = league.slug || getLeagueSlug(league);
        const href = `/leagues/${slug}`;
        const isActive = pathname.startsWith(href) || pathname === `/leagues/${league.id}`;

        return (
          <Link
            key={league.id}
            href={href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--chip-radius)] text-xs font-semibold shrink-0 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              isActive
                ? "bg-[var(--bg-chip)] text-[var(--accent)] font-bold"
                : "bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
            }`}
          >
            <div className="w-5 h-5 rounded bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
              <Image
                src={`/img/league/${league.id}`}
                alt={league.name}
                width={16}
                height={16}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="whitespace-nowrap">{league.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
