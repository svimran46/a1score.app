import React from "react";
import type { PlayerProfileVM, ProfileTransfer } from "@/lib/data/playerProfile.types";
import { formatFeeLabel } from "@/lib/transfers";
import { formatDateGB, formatMonthYear, formatValueEur, spokenEur } from "@/lib/format-value";
import { ValueFigure } from "@/components/players/ValueFigure";
import { NotRecorded, ProfileDisclosure, ProfileSection } from "@/components/players/ProfileSection";

/** Senior rows shown before the "earlier transfers" disclosure. */
export const TRANSFERS_VISIBLE = 6;

function ClubName({ name }: { name: string | null }) {
  return name ? <>{name}</> : <NotRecorded sr="club not recorded" />;
}

function Fee({ t }: { t: ProfileTransfer }) {
  if (t.feeStatus === "disclosed" && formatValueEur(t.feeEur)) {
    return <ValueFigure eur={t.feeEur} size="md" srLabel="Fee" />;
  }
  const fee = formatFeeLabel(t.feeStatus, t.feeEur);
  if (fee.srLabel) return <NotRecorded mark={fee.label} sr={fee.srLabel} />;
  return (
    <span className={t.feeStatus === "undisclosed" ? "text-text-muted" : "text-text-secondary"}>{fee.label}</span>
  );
}

/** Context money: the amount in .figure but secondary, never amber. */
function ValueThen({ v }: { v: NonNullable<ProfileTransfer["valueThen"]> }) {
  return (
    <span className="text-xs leading-4 text-text-secondary">
      {"Market value then "}
      <span className="figure font-semibold">
        <span aria-hidden="true">{formatValueEur(v.valueEur)}</span>
        <span className="sr-only">{spokenEur(v.valueEur)}</span>
      </span>
      {` (${formatMonthYear(v.date)})`}
    </span>
  );
}


/**
 * One move. Narrow: stacked (date / move / value then, fee on the right).
 * Wide: one grid row, Date | Move | Value then | Fee.
 */
function TransferRow({ t }: { t: ProfileTransfer }) {
  return (
    <li
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 border-b border-divider/60 py-3 last:border-b-0 @[560px]/profile:min-h-14 @[560px]/profile:grid-cols-[96px_minmax(0,1fr)_140px_96px] @[560px]/profile:items-center @[560px]/profile:py-2"
    >
      <time
        dateTime={t.date}
        className="col-start-1 row-start-1 text-xs leading-4 tabular-nums text-text-muted @[560px]/profile:col-start-1"
      >
        {formatDateGB(t.date)}
      </time>
      <p
        className="col-start-1 row-start-2 truncate text-sm leading-5 text-text-primary @[560px]/profile:col-start-2 @[560px]/profile:row-start-1"
      >
        <ClubName name={t.fromName} />
        <span aria-hidden="true" className="text-text-muted">{" → "}</span>
        <span className="sr-only">{" to "}</span>
        <ClubName name={t.toName} />
      </p>
      {t.valueThen ? (
        <p className="col-start-1 row-start-3 min-w-0 @[560px]/profile:col-start-3 @[560px]/profile:row-start-1">
          <ValueThen v={t.valueThen} />
        </p>
      ) : null}
      <p
        className="col-start-2 row-span-2 row-start-1 self-center whitespace-nowrap text-right text-sm leading-5 @[560px]/profile:col-start-4 @[560px]/profile:row-span-1 @[560px]/profile:row-start-1"
      >
        <Fee t={t} />
      </p>
    </li>
  );
}

function TransferList({ rows }: { rows: ProfileTransfer[] }) {
  return (
    <ol className="list-none">
      {rows.map((t) => (
        <TransferRow key={t.id} t={t} />
      ))}
    </ol>
  );
}

function SummaryMeta({ summary }: { summary: NonNullable<PlayerProfileVM["transferSummary"]> }) {
  const { totalEur, count, record } = summary;
  const recordFee = formatValueEur(record.feeEur);
  const year = record.date ? new Date(record.date).getUTCFullYear() : null;
  const recordContext = [record.toName, year && Number.isFinite(year) ? String(year) : null].filter(Boolean).join(", ");
  return (
    <>
      <ValueFigure eur={totalEur} size="sm" srLabel="Total" />
      {count === 1 ? " from 1 disclosed fee" : ` across ${count} disclosed fees`}
      {count > 1 && recordFee ? (
        <span className="hidden @[560px]/profile:inline">
          {" · record "}
          <ValueFigure eur={record.feeEur} size="sm" />
          {recordContext ? ` (${recordContext})` : ""}
        </span>
      ) : null}
    </>
  );
}

/**
 * Transfers (#transfers): senior moves newest first with the fee as the
 * source states it and the market value at the time. Server-rendered, no JS:
 * older and youth moves sit in native <details> and stay in the HTML.
 */
export function TransfersSection({ vm }: { vm: PlayerProfileVM }) {
  const all = vm.transfers;
  if (!all || all.length === 0) return null;

  const senior = all.filter((t) => !t.isYouth);
  const youth = all.filter((t) => t.isYouth);
  // Only youth moves: they are the record, so show them as normal rows.
  const main = senior.length > 0 ? senior : youth;
  const visible = main.slice(0, TRANSFERS_VISIBLE);
  const earlier = main.slice(TRANSFERS_VISIBLE);
  const youthDisclosure = senior.length > 0 ? youth : [];

  return (
    <ProfileSection
      id="transfers"
      navLabel="Transfers"
      meta={vm.transferSummary ? <SummaryMeta summary={vm.transferSummary} /> : null}
    >
      <TransferList rows={visible} />
      {earlier.length > 0 ? (
        <ProfileDisclosure
          summary={`${earlier.length} earlier ${earlier.length === 1 ? "transfer" : "transfers"}`}
          className="mt-1 border-t border-divider/60"
        >
          <TransferList rows={earlier} />
        </ProfileDisclosure>
      ) : null}
      {youthDisclosure.length > 0 ? (
        <ProfileDisclosure
          summary={`Youth and reserve moves (${youthDisclosure.length})`}
          className="mt-1 border-t border-divider/60"
        >
          <TransferList rows={youthDisclosure} />
        </ProfileDisclosure>
      ) : null}
    </ProfileSection>
  );
}
