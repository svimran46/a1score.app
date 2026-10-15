import test from "node:test";
import assert from "node:assert/strict";
import type { TransferRecord } from "../src/lib/data/transfers";
import {
  DEFAULT_TRANSFER_FILTERS,
  activeFilterCount,
  filterTransfers,
  involvesFollowed,
  sortTransfers,
} from "../src/lib/transferFilters";

function t(id: string, patch: Partial<TransferRecord>): TransferRecord {
  return {
    id,
    fromClubName: "A",
    toClubName: "B",
    date: "2026-07-01T00:00:00.000Z",
    displayDate: "",
    isAgreedFutureDeal: false,
    feeEur: null,
    transferType: "permanent",
    displayType: "Permanent",
    player: { id: `p-${id}`, sourceId: `tm-${id}`, fullName: id, slug: id },
    ...patch,
  };
}

const rows = [
  t("perm", { feeEur: 50_000_000, date: "2026-08-01T00:00:00.000Z", leagueIds: ["pl"], toClubId: "club-1" }),
  t("loan", { transferType: "loan", date: "2026-08-10T00:00:00.000Z", leagueIds: ["laliga"] }),
  t("option", { transferType: "loan_with_option", feeEur: 2_000_000, date: "2026-07-15T00:00:00.000Z", leagueIds: ["pl"] }),
  t("free", { transferType: "free", feeEur: 0, date: "2026-06-30T00:00:00.000Z" }),
];
const none = { players: new Set<string>(), clubs: new Set<string>() };
const ids = (r: TransferRecord[]) => r.map((x) => x.id);

test("type filter: Loan includes loans with an option to buy", () => {
  assert.deepEqual(ids(filterTransfers(rows, { ...DEFAULT_TRANSFER_FILTERS, type: "loan" }, none)), ["loan", "option"]);
  assert.deepEqual(ids(filterTransfers(rows, { ...DEFAULT_TRANSFER_FILTERS, type: "free" }, none)), ["free"]);
  assert.equal(filterTransfers(rows, DEFAULT_TRANSFER_FILTERS, none).length, 4);
});

test("league and minimum-fee filters", () => {
  assert.deepEqual(ids(filterTransfers(rows, { ...DEFAULT_TRANSFER_FILTERS, league: "pl" }, none)), ["perm", "option"]);
  assert.deepEqual(ids(filterTransfers(rows, { ...DEFAULT_TRANSFER_FILTERS, minFeeEur: 10_000_000 }, none)), ["perm"]);
});

test("following matches player ids (DB or Transfermarkt) and club ids", () => {
  assert.equal(involvesFollowed(rows[1], { players: new Set(["tm-loan"]), clubs: new Set() }), true);
  assert.equal(involvesFollowed(rows[1], { players: new Set(["p-loan"]), clubs: new Set() }), true);
  assert.equal(involvesFollowed(rows[0], { players: new Set(), clubs: new Set(["club-1"]) }), true);
  assert.equal(involvesFollowed(rows[3], { players: new Set(["x"]), clubs: new Set(["club-1"]) }), false);
  const f = { ...DEFAULT_TRANSFER_FILTERS, followingOnly: true };
  assert.deepEqual(ids(filterTransfers(rows, f, { players: new Set(["p-free"]), clubs: new Set(["club-1"]) })), ["perm", "free"]);
  assert.deepEqual(filterTransfers(rows, f, none), []);
});

test("sort by newest or by fee (undisclosed last)", () => {
  assert.deepEqual(ids(sortTransfers(rows, "newest")), ["loan", "perm", "option", "free"]);
  assert.deepEqual(ids(sortTransfers(rows, "fee")), ["perm", "option", "free", "loan"]);
  assert.deepEqual(ids(rows), ["perm", "loan", "option", "free"], "input is not mutated");
});

test("activeFilterCount counts non-default filters", () => {
  assert.equal(activeFilterCount(DEFAULT_TRANSFER_FILTERS), 0);
  assert.equal(activeFilterCount({ type: "loan", league: "pl", minFeeEur: 1, followingOnly: true }), 4);
});
