import { getMostValuablePlayers } from "@/lib/data/players";
import { PlayerCard } from "@/components/PlayerCard";
import { Users } from "lucide-react";

export const revalidate = 3600;

export default async function PlayersPage() {
  const players = await getMostValuablePlayers(40);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-400" />
          Players Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Top market valuations and career profiles in global football
        </p>
      </div>

      {players.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
          No player records synced yet. Run <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code>.
        </div>
      )}
    </div>
  );
}
