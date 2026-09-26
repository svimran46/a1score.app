import Link from "next/link";
import Image from "next/image";
import { getTopClubs } from "@/lib/data/clubs";
import { formatCompactEur } from "@/lib/utils";
import { Shield } from "lucide-react";

export const revalidate = 3600;
export const runtime = "edge";

export default async function ClubsPage() {
  const clubs = await getTopClubs(24);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Football Clubs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Top clubs ranked by squad valuations across world competitions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.length > 0 ? (
          clubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="rounded-2xl glass-panel glass-panel-hover p-5 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-slate-800 p-2 flex-shrink-0">
                  {club.logoUrl ? (
                    <Image src={club.logoUrl} alt={club.name} fill className="object-contain p-1" />
                  ) : (
                    <Shield className="w-6 h-6 m-auto text-slate-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight truncate">
                    {club.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {club.leagueName || club.country || "Club"} • {club.playerCount} Players
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-3">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Squad Value</span>
                <span className="text-sm font-black text-emerald-400">
                  {formatCompactEur(club.totalSquadValue)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-2xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
            No club records synced yet. Run <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code>.
          </div>
        )}
      </div>
    </div>
  );
}
