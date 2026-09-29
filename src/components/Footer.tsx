import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl py-10 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs tracking-tighter">A1</span>
              </div>
              <span className="font-bold tracking-tight text-foreground flex items-center">
                a1score<span className="text-amber-400">.app</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Global football intelligence platform delivering real-time career profiles, market valuations, transfer analytics, and match parity.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-3 text-foreground">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search?filter=valuable" className="hover:text-amber-400 transition-colors">Most Valuable Players</Link></li>
              <li><Link href="/clubs" className="hover:text-amber-400 transition-colors">Top European Clubs</Link></li>
              <li><Link href="/leagues" className="hover:text-amber-400 transition-colors">Premier League, La Liga & More</Link></li>
              <li><Link href="/matches" className="hover:text-amber-400 transition-colors">Live Match Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-3 text-foreground">Top Leagues</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search?league=Premier+League" className="hover:text-amber-400 transition-colors">Premier League</Link></li>
              <li><Link href="/search?league=La+Liga" className="hover:text-amber-400 transition-colors">La Liga</Link></li>
              <li><Link href="/search?league=Serie+A" className="hover:text-amber-400 transition-colors">Serie A</Link></li>
              <li><Link href="/search?league=Bundesliga" className="hover:text-amber-400 transition-colors">Bundesliga</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-3 text-foreground">Intelligence & Sources</h4>
            <p className="text-xs leading-relaxed mb-2 text-[var(--muted-foreground)]">
              Combining Transfermarkt valuation analytics with FotMob real-time match delivery.
            </p>
            <Link href="/methodology" className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
              View Data Methodology →
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} a1score.app. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium">Money meets the pitch.</p>
        </div>
      </div>
    </footer>
  );
}
