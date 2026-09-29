import Link from "next/link";

const exploreLinks = [
  { label: "Matches", href: "/matches" },
  { label: "Players", href: "/players" },
  { label: "Clubs", href: "/clubs" },
  { label: "Leagues", href: "/leagues" },
  { label: "Market Values", href: "/search?filter=valuable" },
  { label: "Transfers", href: "/transfers" },
];

const topLeagues = [
  { label: "Premier League", href: "/search?league=Premier+League" },
  { label: "La Liga", href: "/search?league=La+Liga" },
  { label: "Serie A", href: "/search?league=Serie+A" },
  { label: "Bundesliga", href: "/search?league=Bundesliga" },
  { label: "Ligue 1", href: "/search?league=Ligue+1" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl pt-6 sm:pt-8 pb-24 md:pb-8 mt-12 sm:mt-16 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1 on mobile / Left column on desktop: Brand Block */}
        {/* Row 2 on mobile / Right column on desktop: Explore & Top Leagues */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 sm:gap-8 lg:gap-16 mb-6 sm:mb-8">
          {/* Brand Block */}
          <div className="w-full lg:max-w-sm flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-black text-xs sm:text-sm tracking-tighter">
                  A1
                </span>
              </div>
              <span className="font-bold tracking-tight text-white flex items-center text-sm sm:text-base">
                a1score<span className="text-brand-400">.app</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Global football intelligence platform delivering real-time career profiles, market valuations, transfer analytics, and match parity.
            </p>
          </div>

          {/* Explore & Top Leagues (Two equal-width columns side by side even on 360px mobile) */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:gap-16 w-full lg:w-auto">
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
                      className="h-10 sm:h-11 flex items-center text-slate-400 hover:text-white transition-colors"
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
                Top Leagues
              </h4>
              <ul className="text-xs sm:text-sm">
                {topLeagues.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="h-10 sm:h-11 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row: (c) 2026 a1score.app, plus small links (Methodology, Privacy, Terms) */}
        <div className="pt-4 sm:pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {currentYear} a1score.app. All rights reserved.</p>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <Link
              href="/methodology"
              className="hover:text-slate-300 transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="#privacy"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#terms"
              className="hover:text-slate-300 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
