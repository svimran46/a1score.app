import Link from "next/link";

const exploreLinks = [
  { label: "Matches", href: "/matches" },
  { label: "Players", href: "/players" },
  { label: "Clubs", href: "/clubs" },
  { label: "Leagues", href: "/leagues" },
  { label: "Market Values", href: "/values" },
  { label: "Transfers", href: "/transfers" },
  { label: "Methodology", href: "/methodology" },
];

const topLeagues = [
  { label: "Premier League", href: "/leagues/premier-league-cmuihndux0003b23fizizm4a0" },
  { label: "La Liga", href: "/leagues/laliga-cmuihnet00007b23f2qf4z79i" },
  { label: "Serie A", href: "/leagues/serie-a-cmuihnf000008b23fghk99r1h" },
  { label: "Bundesliga", href: "/leagues/bundesliga-cmuihnfps0009b23fe6s9s949" },
  { label: "Ligue 1", href: "/leagues/ligue-1-cmuihnggh000ab23ftw5z9a34" },
  { label: "Liga Portugal", href: "/leagues/liga-portugal-cmuihnh71000bb23f7w76a380" },
  { label: "Eredivisie", href: "/leagues/eredivisie-cmuihnhvo000cb23f1m06d5s7" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl pt-6 sm:pt-8 pb-24 md:pb-8 mt-12 sm:mt-16 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 sm:gap-8 lg:gap-16 mb-6 sm:mb-8">
          {/* Brand Block */}
          <div className="w-full lg:max-w-sm flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-slate-950 font-black text-xs sm:text-sm tracking-tighter">
                  A1
                </span>
              </div>
              <span className="font-bold tracking-tight text-white flex items-center text-sm sm:text-base">
                a1score<span className="text-amber-400">.app</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Independent football intelligence platform synthesizing real-time match events with player market valuations, squad expenditure analytics, and commercial transfer records.
            </p>
            <p className="text-[11px] text-slate-500">
              Data grounded in FotMob match feeds & Transfermarkt market analytics.
            </p>
          </div>

          {/* Explore & Top Leagues */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-6 sm:gap-8 lg:gap-16 w-full lg:w-auto">
            {/* Column 1: Explore */}
            <div>
              <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-slate-200 h-8 flex items-center">
                Explore
              </h4>
              <ul className="text-xs sm:text-sm">
                {exploreLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="h-9 sm:h-10 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Top Leagues */}
            <div>
              <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-slate-200 h-8 flex items-center">
                Top Competitions
              </h4>
              <ul className="text-xs sm:text-sm">
                {topLeagues.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="h-9 sm:h-10 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom row: (c) 2026 a1score.app, plus real legal links */}
        <div className="pt-4 sm:pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {currentYear} a1score.app. Independent football intelligence.</p>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <Link
              href="/methodology"
              className="hover:text-slate-300 transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
