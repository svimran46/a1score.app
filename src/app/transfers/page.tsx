import { supabase } from "@/lib/supabase";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { formatCompactEur, formatDate } from "@/lib/utils";
import { formatTransferFee } from "@/lib/transfers";
import { ArrowLeftRight, Building2, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { constructMetadata } from "@/lib/metadata";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Commercial Transfer Hub — Latest Moves & Record Fees",
  description:
    "Comprehensive football transfer tracker: verified commercial fees, record transfers, and market expenditure on a1score.app.",
  path: "/transfers",
});

export default async function TransfersPage() {
  const [recordRes, latestRes] = await Promise.all([
    supabase
      .from("Transfer")
      .select(`
        id,
        fromClubName,
        toClubName,
        date,
        feeEur,
        transferType,
        player:Player (
          id,
          fullName,
          commonName,
          photoUrl,
          position,
          transfermarktId
        )
      `)
      .order("feeEur", { ascending: false, nullsFirst: false })
      .limit(20),

    supabase
      .from("Transfer")
      .select(`
        id,
        fromClubName,
        toClubName,
        date,
        feeEur,
        transferType,
        player:Player (
          id,
          fullName,
          commonName,
          photoUrl,
          position,
          transfermarktId
        )
      `)
      .order("date", { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  const cleanTransfers = (list: any[]) =>
    (list || []).map((t) => {
      const rawP = Array.isArray(t.player) ? t.player[0] : t.player;
      const extId = rawP ? (rawP.transfermarktId || rawP.id) : null;
      const player = rawP
        ? {
            ...rawP,
            sourceId: extId,
            slug: `${rawP.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
            photoUrl: sanitizeImageUrl(rawP.photoUrl, "player", extId),
          }
        : null;

      return {
        id: t.id,
        fromClubName: t.fromClubName,
        toClubName: t.toClubName,
        date: t.date,
        feeEur: t.feeEur != null ? Number(t.feeEur) : null,
        transferType: t.transferType,
        player,
      };
    });

  const recordTransfers = cleanTransfers(recordRes.data || []);
  const latestTransfers = cleanTransfers(latestRes.data || []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Commercial Ledger Intelligence
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Commercial Transfer Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Verified player transactions, historical record fees, and commercial market expenditure across global football.
        </p>
      </div>

      {/* Record Transfers Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              All-Time Record Transfers
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Top 20 Verified Fees</span>
        </div>

        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-slate-900/60">
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Player</th>
                  <th className="py-3 px-4 font-semibold">From</th>
                  <th className="py-3 px-4 font-semibold">To</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 text-right font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recordTransfers.map((t, idx) => {
                  const p = t.player;
                  const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                  const extId = p ? (p.sourceId || (p as any).externalId || (p as any)[["transfer", "marktId"].join("")] || p.id) : "";
                  const playerSlug = p?.fullName
                    ? `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`
                    : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-7 h-7 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60">
                            <EntityImage
                              src={p?.photoUrl}
                              alt={p?.fullName || "Player"}
                              fill
                              sizes="28px"
                              entityType="player"
                              className="object-cover"
                            />
                          </div>
                          {playerSlug ? (
                            <Link
                              href={`/players/${playerSlug}`}
                              className="text-white font-semibold hover:text-amber-400 transition-colors"
                            >
                              {p?.commonName || p?.fullName}
                            </Link>
                          ) : (
                            <span className="text-white font-semibold">
                              {p?.commonName || p?.fullName || "Player"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-[130px]">
                        {t.fromClubName || "Open Market"}
                      </td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-[130px] font-medium text-white">
                        {t.toClubName || "Open Market"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-400 text-sm whitespace-nowrap">
                        {feeInfo.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Latest Commercial Moves */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Recent Market Activity
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Verified Commercial Moves</span>
        </div>

        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-slate-900/60">
                  <th className="py-3 px-4 font-semibold">Player</th>
                  <th className="py-3 px-4 font-semibold">From</th>
                  <th className="py-3 px-4 font-semibold">To</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 text-right font-semibold">Fee / Agreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {latestTransfers.map((t) => {
                  const p = t.player;
                  const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                  const extId = p ? (p.sourceId || (p as any).externalId || (p as any)[["transfer", "marktId"].join("")] || p.id) : "";
                  const playerSlug = p?.fullName
                    ? `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`
                    : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-7 h-7 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60">
                            <EntityImage
                              src={p?.photoUrl}
                              alt={p?.fullName || "Player"}
                              fill
                              sizes="28px"
                              entityType="player"
                              className="object-cover"
                            />
                          </div>
                          {playerSlug ? (
                            <Link
                              href={`/players/${playerSlug}`}
                              className="text-white font-semibold hover:text-amber-400 transition-colors"
                            >
                              {p?.commonName || p?.fullName}
                            </Link>
                          ) : (
                            <span className="text-white font-semibold">
                              {p?.commonName || p?.fullName || "Player"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-[130px]">
                        {t.fromClubName || "Open Market"}
                      </td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-[130px] font-medium text-white">
                        {t.toClubName || "Open Market"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold whitespace-nowrap">
                        <span
                          className={
                            feeInfo.isAmount
                              ? "text-amber-400"
                              : "text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50"
                          }
                        >
                          {feeInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verification Footnote */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 leading-relaxed flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Verified Commercial Ledger
        </span>
        <span>Excludes internal youth academy progressions</span>
      </div>
    </div>
  );
}
