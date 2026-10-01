import { Suspense } from "react";
import { getAllClubs } from "@/lib/data/clubs";
import { ClubsDirectoryClient } from "@/components/ClubsDirectoryClient";

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
    <Suspense
      fallback={
        <div className="rounded-3xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
          Loading football clubs directory...
        </div>
      }
    >
      <ClubsDirectoryClient initialClubs={clubs} />
    </Suspense>
  );
}
