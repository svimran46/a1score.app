import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-10 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center">
                <span className="text-white font-black text-xs">A1</span>
              </div>
              <span className="text-white font-bold tracking-tight">a1score.app</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Global football intelligence platform delivering real-time career profiles, market valuations, transfer history, and analytics.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search?filter=valuable" className="hover:text-emerald-400 transition-colors">Most Valuable Players</Link></li>
              <li><Link href="/clubs" className="hover:text-emerald-400 transition-colors">Top European Clubs</Link></li>
              <li><Link href="/leagues" className="hover:text-emerald-400 transition-colors">Premier League, La Liga & More</Link></li>
              <li><Link href="/transfers" className="hover:text-emerald-400 transition-colors">Latest Transfers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Top Leagues</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search?league=Premier+League" className="hover:text-emerald-400 transition-colors">Premier League</Link></li>
              <li><Link href="/search?league=La+Liga" className="hover:text-emerald-400 transition-colors">La Liga</Link></li>
              <li><Link href="/search?league=Serie+A" className="hover:text-emerald-400 transition-colors">Serie A</Link></li>
              <li><Link href="/search?league=Bundesliga" className="hover:text-emerald-400 transition-colors">Bundesliga</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Data Pipeline</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Powered by open dataset ingestion and API-Football verification. High-fidelity valuation metrics and stats updated regularly.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} a1score.app. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Independent football database platform.</p>
        </div>
      </div>
    </footer>
  );
}
