import { Suspense } from "react";
import { getAllClubs } from "@/lib/data/clubs";
import { ClubsDirectoryClient } from "@/components/ClubsDirectoryClient";
import { Shield } from "lucide-react";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football Clubs Directory — Squad Market Values & Rosters",
  description:
    "Browse European and global football clubs ranked by cumulative squad market valuations, squad sizes, and active rosters on a1score.app.",
  path: "/clubs",
});

export default async function ClubsPage() {
  const clubs = await getAllClubs();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3 [text-wrap:balance]">
          <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
          Football Clubs Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 [text-wrap:balance]">
          Comprehensive club directory ranked by squad market valuations, squad sizes, and league standings
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-3xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
            Loading football clubs directory...
          </div>
        }
      >
        <ClubsDirectoryClient initialClubs={clubs} />
      </Suspense>
    </div>
  );
}
