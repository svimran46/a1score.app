import test from "node:test";
import assert from "node:assert/strict";
import {
  ageOn,
  currentValuation,
  firstOnRecord,
  monthsUntil,
  parseContractUntil,
  peak,
  realPoints,
  sincePrevious,
  staleness,
  twelveMonth,
  valueAt,
} from "../src/lib/valuation";
import { describeDelta } from "../src/lib/format-value";

const NOW = new Date("2026-10-09T12:00:00.000Z");

const pts = (rows: Array<[string, number]>) =>
  realPoints(rows.map(([date, valueEur], i) => ({ id: `p${i}`, date, valueEur, clubName: null })));

test("realPoints drops synthetic, zero, negative and invalid points; sorts and de-duplicates by day", () => {
  const out = realPoints([
    { id: "b", date: "2025-06-10T18:00:00Z", valueEur: 160, clubName: " City " },
    { id: "latest-x", date: "2026-10-09T00:00:00Z", valueEur: 999, clubName: null },
    { id: "z", date: "2024-01-01", valueEur: 0 },
    { id: "n", date: "2024-02-01", valueEur: -5 },
    { id: "bad", date: "nope", valueEur: 10 },
    { id: "nodate", valueEur: 10 },
    { id: "a", date: "2025-06-10T00:00:00Z", valueEur: "155" },
    { id: "c", date: "2020-01-01", valueEur: 100, clubName: "" },
    null,
  ]);
  assert.deepEqual(
    out.map((p) => [p.date.slice(0, 10), p.valueEur, p.clubName]),
    [
      ["2020-01-01", 100, null],
      ["2025-06-10", 160, "City"],
    ]
  );
  assert.deepEqual(realPoints(undefined), []);
  assert.deepEqual(realPoints("nope"), []);
});

test("currentValuation: latestMarketValue wins; asOf only when the last point carries it", () => {
  const p = pts([["2025-01-01", 100], ["2026-01-01", 150]]);
  assert.deepEqual(currentValuation(150, p), { valueEur: 150, asOf: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(currentValuation(180, p), { valueEur: 180, asOf: null });
  assert.deepEqual(currentValuation(0, p), { valueEur: 150, asOf: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(currentValuation(null, p), { valueEur: 150, asOf: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(currentValuation(50, []), { valueEur: 50, asOf: null });
  assert.equal(currentValuation(0, []), null);
  assert.equal(currentValuation(undefined, []), null);
});

test("sincePrevious uses the last two real points and needs a dated current value", () => {
  const p = pts([["2024-01-01", 80], ["2025-06-10", 160], ["2026-05-27", 180]]);
  const cur = currentValuation(180, p);
  const d = sincePrevious(p, cur);
  assert.deepEqual(d, { diffEur: 20, pct: 12.5, basisDate: "2025-06-10T00:00:00.000Z" });

  assert.equal(sincePrevious(p, currentValuation(200, p)), null, "asOf null -> no delta");
  assert.equal(sincePrevious(p.slice(0, 1), currentValuation(80, p.slice(0, 1))), null, "1 point");
  assert.equal(sincePrevious([], null), null);

  const flat = pts([["2025-11-01", 50], ["2026-04-01", 50]]);
  const z = sincePrevious(flat, currentValuation(50, flat));
  assert.ok(z);
  assert.equal(z.diffEur, 0);
  assert.equal(describeDelta(z).text, "Unchanged since Nov 2025");
});

test("twelveMonth is strict: baseline must be at least 365 days old, never the earliest point", () => {
  const p = pts([["2025-06-10", 160], ["2026-05-27", 180]]);
  const cur = currentValuation(180, p);
  assert.deepEqual(twelveMonth(p, cur, NOW), { diffEur: 20, pct: 12.5, basisDate: "2025-06-10T00:00:00.000Z" });

  // Only 200 days of history: no baseline, no fallback.
  const young = pts([["2026-03-23", 10], ["2026-09-01", 12]]);
  assert.equal(twelveMonth(young, currentValuation(12, young), NOW), null);

  // Exactly 365 days old qualifies; one day short does not.
  const edge = pts([["2025-10-09T12:00:00Z", 10], ["2026-09-01", 12]]);
  assert.equal(twelveMonth(edge, currentValuation(12, edge), NOW)?.basisDate, "2025-10-09T12:00:00.000Z");
  const short = pts([["2025-10-10T12:00:00Z", 10], ["2026-09-01", 12]]);
  assert.equal(twelveMonth(short, currentValuation(12, short), NOW), null);

  // Last point on or before the cutoff is the baseline.
  const many = pts([["2023-01-01", 1], ["2025-01-01", 5], ["2025-12-01", 8], ["2026-09-01", 10]]);
  assert.equal(twelveMonth(many, currentValuation(10, many), NOW)?.basisDate, "2025-01-01T00:00:00.000Z");

  assert.equal(twelveMonth(p, currentValuation(999, p), NOW), null, "undated current value");
  assert.equal(twelveMonth(p, null, NOW), null);
});

test("peak needs 2 points, reports the first date at the maximum and the drawdown", () => {
  const p = pts([["2020-01-01", 100], ["2024-03-01", 200], ["2024-09-01", 200], ["2026-05-27", 180]]);
  assert.deepEqual(peak(p, currentValuation(180, p)), {
    valueEur: 200,
    date: "2024-03-01T00:00:00.000Z",
    pctBelow: 10,
    isCurrent: false,
  });
  const atPeak = pts([["2020-01-01", 100], ["2026-05-27", 300]]);
  const pk = peak(atPeak, currentValuation(300, atPeak));
  assert.equal(pk?.isCurrent, true);
  assert.equal(pk?.pctBelow, 0);
  assert.equal(peak(pts([["2026-01-01", 5]]), null), null);
  assert.equal(peak([], null), null);
});

test("firstOnRecord and ageOn", () => {
  const p = pts([["2017-02-01", 5_000_000], ["2020-01-01", 10]]);
  assert.deepEqual(firstOnRecord(p, "2000-07-21"), { valueEur: 5_000_000, date: "2017-02-01T00:00:00.000Z", ageAtDate: 16 });
  assert.deepEqual(firstOnRecord(p, null), { valueEur: 5_000_000, date: "2017-02-01T00:00:00.000Z", ageAtDate: null });
  assert.equal(firstOnRecord([], "2000-01-01"), null);
  assert.equal(ageOn("2000-07-21", "2017-07-20"), 16);
  assert.equal(ageOn("2000-07-21", "2017-07-21"), 17);
  assert.equal(ageOn("bad", "2017-07-21"), null);
  assert.equal(ageOn("2030-01-01", "2017-07-21"), null);
});

test("valueAt returns the valuation in effect within 183 days, else null", () => {
  const p = pts([["2022-01-01", 50], ["2022-03-15", 150]]);
  assert.equal(valueAt(p, "2022-07-01")?.valueEur, 150);
  assert.equal(valueAt(p, "2022-03-15")?.valueEur, 150, "same day counts");
  assert.equal(valueAt(p, "2022-02-01")?.valueEur, 50);
  assert.equal(valueAt(p, "2021-12-31"), null, "nothing before");
  assert.equal(valueAt(p, "2022-09-15"), null, "184 days after the last point");
  assert.equal(valueAt(p, "2022-09-14")?.valueEur, 150, "183 days after");
  assert.equal(valueAt(p, "garbage"), null);
  assert.equal(valueAt(p, "2022-07-01", 30), null);
});

test("staleness bands", () => {
  const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
  assert.equal(staleness(ago(0), NOW), "fresh");
  assert.equal(staleness(ago(180), NOW), "fresh");
  assert.equal(staleness(ago(181), NOW), "aging");
  assert.equal(staleness(ago(365), NOW), "aging");
  assert.equal(staleness(ago(366), NOW), "stale");
  assert.equal(staleness(null, NOW), "unknown");
  assert.equal(staleness("nope", NOW), "unknown");
});

test("parseContractUntil accepts ISO, dd/mm/yyyy and dd.mm.yyyy only", () => {
  assert.equal(parseContractUntil("30/06/2029"), "2029-06-30T00:00:00.000Z");
  assert.equal(parseContractUntil("30.06.2029"), "2029-06-30T00:00:00.000Z");
  assert.equal(parseContractUntil("1/7/2029"), "2029-07-01T00:00:00.000Z");
  assert.equal(parseContractUntil("2029-06-30"), "2029-06-30T00:00:00.000Z");
  assert.equal(parseContractUntil("2029-06-30T00:00:00.000Z"), "2029-06-30T00:00:00.000Z");
  assert.equal(parseContractUntil(new Date("2029-06-30T00:00:00Z")), "2029-06-30T00:00:00.000Z");
  for (const bad of ["", "-", "n/a", "Jun 30, 2029", "31/02/2029", "30/13/2029", "2029", "06/30/2029", null, undefined]) {
    assert.equal(parseContractUntil(bad as any), null, String(bad));
  }
});

test("monthsUntil counts whole calendar months", () => {
  assert.equal(monthsUntil("2029-06-30", NOW), 32);
  assert.equal(monthsUntil("2026-11-09T12:00:00Z", NOW), 1);
  assert.equal(monthsUntil("2026-11-08", NOW), 0);
  assert.equal(monthsUntil("2026-08-09", NOW), -2);
  assert.equal(monthsUntil(null, NOW), null);
});
