import { supabase } from "@/lib/supabase";
import { formatCompactEur, formatDate } from "@/lib/utils";
import { constructMetadata } from "@/lib/metadata";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { Card, SectionHeader, TransferRow } from "@/components/ui";
import { ShieldCheck, Flame, ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Commercial Transfer Hub — Latest Moves & Record Fees",
  description:
    "Comprehensive football transfer tracker: documented commercial fees, record transfers, and market expenditure on a1score.app.",
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
    <div className="space-y-6 max-w-[720px] mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--chip-radius)] bg-[var(--bg-chip)] text-[var(--value-text)] text-xs font-semibold mb-2">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Commercial Ledger Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Transfers
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Documented player transactions, historical record fees, and commercial market expenditure across global football.
        </p>
      </div>

      {/* 1. All-Time Record Transfers */}
      <section className="space-y-2">
        <SectionHeader
          title="All-Time Record Transfers"
          action={<span className="text-xs text-[var(--text-muted)] font-medium">Top 20 Documented Fees</span>}
        />
        <Card className="p-1 overflow-hidden">
          <div className="divide-y divide-[var(--divider)]">
            {recordTransfers.map((t) => (
              <TransferRow
                key={t.id}
                id={t.id}
                playerName={t.player?.commonName || t.player?.fullName || "Player"}
                playerSlug={t.player?.slug}
                playerAvatar={t.player?.photoUrl}
                playerPosition={t.player?.position}
                fromClubName={t.fromClubName}
                toClubName={t.toClubName}
                fee={t.feeEur}
                transferType={t.transferType}
                date={formatDate(t.date)}
              />
            ))}
          </div>
        </Card>
      </section>

      {/* 2. Recent Market Activity */}
      <section className="space-y-2">
        <SectionHeader
          title="Recent Market Activity"
          action={<span className="text-xs text-[var(--text-muted)] font-medium">Documented Commercial Moves</span>}
        />
        <Card className="p-1 overflow-hidden">
          <div className="divide-y divide-[var(--divider)]">
            {latestTransfers.map((t) => (
              <TransferRow
                key={t.id}
                id={t.id}
                playerName={t.player?.commonName || t.player?.fullName || "Player"}
                playerSlug={t.player?.slug}
                playerAvatar={t.player?.photoUrl}
                playerPosition={t.player?.position}
                fromClubName={t.fromClubName}
                toClubName={t.toClubName}
                fee={t.feeEur}
                transferType={t.transferType}
                date={formatDate(t.date)}
              />
            ))}
          </div>
        </Card>
      </section>

      {/* Verification Footnote */}
      <div className="pt-3 border-t border-[var(--divider)] text-[11px] text-[var(--text-muted)] leading-relaxed flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--value-text)]" />
          Documented Commercial Ledger
        </span>
        <span>Excludes internal youth academy progressions</span>
      </div>
    </div>
  );
}
