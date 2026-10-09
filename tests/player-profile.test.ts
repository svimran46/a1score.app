process.env.SITE_URL = process.env.SITE_URL || "https://a1score.app";

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildPlayerProfile, toValueChartProps, resolveClubName } from "../src/lib/data/playerProfile";
import { getProfileSeasonStats, verifyFotmobRows, seasonStartYear, clubNamesMatch } from "../src/lib/data/playerSeason";
import { feeStatusFromTmFee, feeStatusFromDb, formatFeeLabel } from "../src/lib/transfers";
import { tmGetPlayer } from "../src/lib/transfermarkt/client";
import { getRelatedNews } from "../src/lib/data/news";
import { describeDelta } from "../src/lib/format-value";
import type { PlayerAchievementsGrouped } from "../src/lib/data/playerAchievements";
import type { PlayerProfileVM, SeasonStatRow } from "../src/lib/data/playerProfile.types";

const NOW = new Date("2026-10-09T12:00:00.000Z");
const TODAY = "2026-10-09";

function fixture(name: string): any {
  return JSON.parse(readFileSync(join(__dirname, "fixtures", "players", `${name}.json`), "utf8"));
}

function build(name: string, ctx: Parameters<typeof buildPlayerProfile>[1] = {}): PlayerProfileVM {
  return buildPlayerProfile(fixture(name), { now: NOW, ...ctx });
}

/** Strings that must never appear in a VM: invented placeholders and fabricated dates. */
function assertHonest(vm: PlayerProfileVM) {
  const json = JSON.stringify(vm);
  for (const banned of ["Unknown", "Free Agent", "Footballer", "Review pending", "Pending", "Free Transfer"]) {
    assert.ok(!json.includes(banned), `VM contains "${banned}"`);
  }
  assert.ok(!vm.valuation.points.some((p) => p.date.startsWith(TODAY)), "no valuation point dated today");
  assert.ok(!vm.transfers.some((t) => new Date(t.date).getTime() > NOW.getTime()), "no future transfers");
}

async function withFetch<T>(stub: (url: string) => Promise<Response> | Response, fn: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: any) => stub(typeof input === "string" ? input : String(input?.url ?? input))) as any;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// ---------------------------------------------------------------------------
// TM path with history
// ---------------------------------------------------------------------------

test("TM path with history: identity, club, contract, valuation and deltas", () => {
  const vm = build("tm-history");
  assertHonest(vm);

  assert.equal(vm.identity.key, "418560");
  assert.equal(vm.identity.dbId, null);
  assert.equal(vm.identity.slug, "erling-haaland-418560");
  assert.equal(vm.identity.displayName, "Erling Haaland");
  assert.equal(vm.identity.nationality, "Norway", "&nbsp; decoded and trimmed");
  assert.equal(vm.identity.position, "Centre-Forward", "TM uses position");
  assert.equal(vm.identity.alsoPlays, "Second Striker", "TM subPosition is the secondary role");
  assert.equal(vm.identity.age, 26);
  assert.equal(vm.identity.heightCm, 195);

  assert.ok(vm.club);
  assert.equal(vm.club.name, "Manchester City");
  assert.equal(vm.club.shortName, "Man City");
  assert.equal(vm.club.href, "/clubs/manchester-city-cmcityclub000000000000000");
  assert.deepEqual(vm.club.league, { name: "Premier League", href: "/leagues/premier-league-cmpremleague0000000000000" });

  assert.equal(vm.status.kind, "signed");
  assert.equal(vm.status.contractUntil, "2029-06-30T00:00:00.000Z", "parsed from 30/06/2029");
  assert.equal(vm.status.contractMonthsLeft, 32);
  assert.equal(vm.status.parentClub, null);

  const v = vm.valuation;
  assert.equal(v.points.length, 7, "zero point dropped, same-day duplicate merged");
  assert.deepEqual(v.current, { valueEur: 180_000_000, asOf: "2026-05-27T00:00:00.000Z" });
  assert.equal(v.staleness, "fresh");
  assert.equal(v.label, "Market value");
  assert.ok(v.sincePrevious);
  assert.equal(describeDelta(v.sincePrevious).text, "▲ +€20M (+12.5%) since Jun 2025");
  assert.ok(v.twelveMonth);
  assert.equal(v.twelveMonth.basisDate, "2025-06-10T18:00:00.000Z");
  assert.deepEqual(v.peak, { valueEur: 200_000_000, date: "2024-03-01T00:00:00.000Z", pctBelow: 10, isCurrent: false });
  assert.deepEqual(v.first, { valueEur: 5_000_000, date: "2017-02-01T00:00:00.000Z", ageAtDate: 16 });

  assert.equal(vm.season.lookupName, "Erling Haaland");
  assert.equal(vm.season.verifyClubName, "Manchester City");
  assert.deepEqual(vm.season.dbRows, []);
  assert.deepEqual(vm.injuries, []);
  assert.equal(vm.honours, null, "no dbId -> no honours");
});

test("TM path transfers: invalid and future rows dropped, fee statuses kept, value then within 183 days", () => {
  const vm = build("tm-history");
  assert.deepEqual(
    vm.transfers.map((t) => t.id),
    ["tm-tf-1", "tm-tf-2", "tm-tf-3", "tm-tf-4", "tm-tf-5"],
    "newest first; 'not a date' and the 2027 move are gone"
  );
  const byId = Object.fromEntries(vm.transfers.map((t) => [t.id, t]));
  assert.equal(byId["tm-tf-1"].feeStatus, "disclosed");
  assert.deepEqual(byId["tm-tf-1"].valueThen, { valueEur: 150_000_000, date: "2022-03-15T00:00:00.000Z" });
  assert.equal(byId["tm-tf-2"].valueThen, null, "no valuation within 183 days before the move");
  assert.equal(byId["tm-tf-3"].feeStatus, "undisclosed");
  assert.equal(byId["tm-tf-4"].feeStatus, "not_recorded");
  assert.equal(byId["tm-tf-5"].feeStatus, "loan_return");
  assert.equal(byId["tm-tf-5"].isYouth, true, "Molde FK II is a reserve side");
  assert.equal(byId["tm-tf-1"].isYouth, false);

  assert.equal(formatFeeLabel(byId["tm-tf-1"].feeStatus, byId["tm-tf-1"].feeEur).label, "€60M");
  assert.equal(formatFeeLabel(byId["tm-tf-3"].feeStatus, byId["tm-tf-3"].feeEur).label, "Fee undisclosed");
  assert.deepEqual(formatFeeLabel(byId["tm-tf-4"].feeStatus, byId["tm-tf-4"].feeEur), {
    label: "—",
    isAmount: false,
    srLabel: "No fee recorded",
  });
  assert.equal(formatFeeLabel(byId["tm-tf-5"].feeStatus, byId["tm-tf-5"].feeEur).label, "End of loan");
  for (const t of vm.transfers) {
    assert.notEqual(formatFeeLabel(t.feeStatus, t.feeEur).label, "Free transfer");
  }

  assert.deepEqual(vm.transferSummary, {
    totalEur: 80_000_000,
    count: 2,
    record: { feeEur: 60_000_000, toName: "Manchester City", date: "2022-07-01T00:00:00.000Z" },
  });
});

test("TM path with a DB identity: dbId, honours and DB-only facts attach", () => {
  const achievements: PlayerAchievementsGrouped = {
    majorHonours: [],
    domesticCupsAndOther: [],
    individualAwards: [],
    all: [],
    totalTitles: 4,
  };
  const dbIdentity = {
    id: "cdbidentity00000000000000",
    status: "first_team",
    lastSeason: 2025,
    parentClub: null,
    injuries: [{ id: "i1", type: "Foot injury", startDate: "2026-09-01T00:00:00Z", endDate: null, status: "active" }],
    seasonStats: [{ id: "s1", season: "2025/2026", competition: "Premier League", clubName: "Manchester City", appearances: 10, goals: null }],
  };
  const vm = build("tm-history", { dbIdentity, achievements });
  assert.equal(vm.identity.key, "418560", "follow key unchanged");
  assert.equal(vm.identity.dbId, "cdbidentity00000000000000");
  assert.equal(vm.honours?.totalTitles, 4);
  assert.deepEqual(vm.status.activeInjury, { type: "Foot injury" });
  assert.equal(vm.injuries[0].since, "2026-09-01T00:00:00.000Z");
  assert.equal(vm.season.dbRows.length, 1);
  assert.equal(vm.season.dbRows[0].goals, null, "never zero-filled");
  assert.equal(vm.season.dbRows[0].assists, null);

  const none = build("tm-history", { dbIdentity, achievements: { ...achievements, totalTitles: 0 } });
  assert.equal(none.honours, null, "zero titles -> hidden");
});

// ---------------------------------------------------------------------------
// DB path where latestMarketValue differs from the last point
// ---------------------------------------------------------------------------

test("DB path, latest value differs from history: asOf null, no point today, no delta", () => {
  const vm = build("db-latest-differs");
  assertHonest(vm);

  assert.equal(vm.identity.dbId, vm.identity.key);
  assert.equal(vm.identity.slug, "jamal-musiala-580195");
  assert.equal(vm.identity.position, "Attacking Midfield", "DB uses subPosition over the broad group");
  assert.equal(vm.identity.alsoPlays, null, "alsoPlays is TM only");

  const v = vm.valuation;
  assert.equal(v.points.length, 2, "synthetic latest- point excluded");
  assert.deepEqual(v.current, { valueEur: 180_000_000, asOf: null });
  assert.equal(v.staleness, "unknown");
  assert.equal(v.sincePrevious, null);
  assert.equal(v.twelveMonth, null);
  assert.equal(v.peak?.valueEur, 150_000_000);
  assert.equal(v.peak?.date, "2025-12-15T00:00:00.000Z");

  assert.equal(vm.status.contractUntil, null, "contract is TM only");
  assert.equal(vm.status.kind, "unknown");
  assert.deepEqual(vm.status.activeInjury, { type: "Hamstring injury" });
  assert.equal(vm.injuries.length, 2);
  assert.equal(vm.injuries[0].isActive, true);

  const fees = Object.fromEntries(vm.transfers.map((t) => [t.id, t]));
  assert.equal(fees.t1.feeStatus, "disclosed");
  assert.equal(fees.t1.valueThen, null, "last valuation is 198 days before the move");
  assert.equal(fees.t2.feeStatus, "not_recorded", "a 0 fee is not a free transfer");
  assert.equal(fees.t2.isYouth, true);
  assert.equal(fees.t3.feeStatus, "not_recorded");
  assert.equal(vm.transferSummary?.count, 1);

  assert.equal(vm.season.dbRows.length, 1);
  assert.equal(vm.season.dbRows[0].assists, null);
  assert.equal(vm.season.dbRows[0].appearances, 30);

  const chart = toValueChartProps(vm);
  assert.ok(chart);
  assert.equal(chart.points.length, 2);
  assert.ok(!chart.points.some(([t]) => t === 180_000_000 || new Date(t).toISOString().startsWith(TODAY)), "headline value not plotted");
  assert.deepEqual(chart.markers, [[Date.parse("2026-07-01T00:00:00.000Z"), 50_000_000, "Liverpool FC"]]);
});

// ---------------------------------------------------------------------------
// Status states
// ---------------------------------------------------------------------------

test("free agent: club null, status free_agent, no FotMob verification", () => {
  const vm = build("tm-free-agent");
  assertHonest(vm);
  assert.equal(vm.club, null);
  assert.equal(vm.status.kind, "free_agent");
  assert.equal(vm.status.contractUntil, null);
  assert.equal(vm.identity.position, null, "missing position is null, not 'Unknown'");
  assert.equal(vm.season.verifyClubName, null);
  assert.equal(vm.valuation.label, "Market value");
  assert.ok(vm.valuation.sincePrevious);
  assert.equal(describeDelta(vm.valuation.sincePrevious).text, "▼ −€1M (−33.3%) since Jun 2025");
});

test("retired: 'Last market value', no delta, no contract", () => {
  const vm = build("tm-retired");
  assertHonest(vm);
  assert.equal(vm.status.kind, "retired");
  assert.equal(vm.club, null);
  assert.equal(vm.valuation.label, "Last market value");
  assert.equal(vm.valuation.staleness, "stale");
  assert.equal(vm.valuation.sincePrevious, null);
  assert.equal(vm.valuation.twelveMonth, null);
  assert.equal(vm.status.contractUntil, null, "a stale contract string is not shown for a retired player");
  assert.equal(toValueChartProps(vm)?.ended, true);
});

test("on loan: parent club from DB, never a loan end date", () => {
  const vm = build("db-on-loan");
  assertHonest(vm);
  assert.equal(vm.status.kind, "on_loan");
  assert.equal(vm.status.parentClub?.name, "Arsenal FC");
  assert.equal(vm.status.parentClub?.shortName, "Arsenal");
  assert.equal(vm.status.parentClub?.href, "/clubs/arsenal-fc-cmarsenal0000000000000000");
  assert.equal(vm.status.contractUntil, null);
  assert.equal(vm.club?.name, "Ipswich Town");
  assert.equal(vm.club?.league, null);
  assert.equal(vm.identity.displayName, "Sample Loanee", "falls back to fullName");
  assert.equal(vm.identity.position, "Central Midfield");
  assert.ok(!JSON.stringify(vm).includes("2027-06-30"), "loanUntil placeholder never surfaces");
  assert.equal(vm.transfers[0].feeStatus, "not_recorded", "DB rows: no fee -> not recorded, even when typed loan");
});

// ---------------------------------------------------------------------------
// History sizes
// ---------------------------------------------------------------------------

test("one point: current value dated, no delta, no peak, no chart", () => {
  const vm = build("tm-one-point");
  assertHonest(vm);
  assert.equal(vm.valuation.points.length, 1);
  assert.deepEqual(vm.valuation.current, { valueEur: 2_000_000, asOf: "2026-02-04T00:00:00.000Z" });
  assert.equal(vm.valuation.sincePrevious, null);
  assert.equal(vm.valuation.twelveMonth, null);
  assert.equal(vm.valuation.peak, null);
  assert.equal(vm.valuation.first?.valueEur, 2_000_000);
  assert.equal(vm.valuation.first?.ageAtDate, 17);
  assert.equal(toValueChartProps(vm), null);
  assert.equal(vm.club?.href, null, "TM club id without a DB match gets no link");
  assert.equal(vm.club?.league?.href, null);
  assert.equal(vm.status.kind, "unknown", "no contract on record");
});

test("no history: every valuation field is null and nothing is invented", () => {
  const vm = build("db-no-history");
  assertHonest(vm);
  assert.equal(vm.valuation.points.length, 0);
  assert.equal(vm.valuation.current, null);
  assert.equal(vm.valuation.staleness, "unknown");
  assert.equal(vm.valuation.peak, null);
  assert.equal(vm.valuation.first, null);
  assert.equal(vm.valuation.sincePrevious, null);
  assert.equal(vm.identity.position, null, "'Unknown' position becomes null");
  assert.equal(vm.identity.nationality, null);
  assert.equal(vm.identity.dob, null);
  assert.equal(vm.identity.age, null);
  assert.equal(vm.club, null);
  assert.deepEqual(vm.transfers, []);
  assert.equal(vm.transferSummary, null);
  assert.equal(vm.news, null);
  assert.equal(toValueChartProps(vm), null);
});

test("zero change: delta of 0 reads 'Unchanged since', ISO contract parsed", () => {
  const vm = build("tm-zero-change");
  assertHonest(vm);
  const d = vm.valuation.sincePrevious;
  assert.ok(d);
  assert.equal(d.diffEur, 0);
  assert.equal(d.pct, 0);
  assert.equal(describeDelta(d).text, "Unchanged since Nov 2025");
  assert.equal(vm.status.kind, "signed");
  assert.equal(vm.status.contractUntil, "2028-06-30T00:00:00.000Z");
  assert.equal(vm.status.contractMonthsLeft, 20);
  assert.equal(vm.valuation.peak?.isCurrent, true);
});

test("news: at most 3 items and the scope passes through", () => {
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: `n${i}`,
    title: `Story ${i}`,
    snippet: "",
    source: "BBC Sport",
    publishedAt: "2026-10-01T00:00:00Z",
    url: `https://x/${i}`,
    tags: [],
  }));
  const vm = build("tm-history", { news: { items, scope: "club" } });
  assert.equal(vm.news?.items.length, 3);
  assert.equal(vm.news?.scope, "club");
  assert.equal(build("tm-history", { news: { items: [], scope: "player" } }).news, null);
});

test("toValueChartProps: compact tuples, club index and fee markers for senior moves", () => {
  const vm = build("tm-history");
  const chart = toValueChartProps(vm);
  assert.ok(chart);
  assert.equal(chart.points.length, 7);
  assert.deepEqual(chart.clubs, ["Molde FK", "Borussia Dortmund", "Manchester City"]);
  assert.deepEqual(chart.points[0], [Date.parse("2017-02-01T00:00:00.000Z"), 5_000_000, 0]);
  assert.deepEqual(
    chart.markers.map((m) => [new Date(m[0]).toISOString().slice(0, 10), m[1], m[2]]),
    [
      ["2020-01-01", 20_000_000, "Borussia Dortmund"],
      ["2022-07-01", 60_000_000, "Manchester City"],
    ]
  );
  assert.equal(chart.playerName, "Erling Haaland");
  assert.equal(chart.ended, false);
});

test("resolveClubName ignores TM pseudo clubs", () => {
  assert.equal(resolveClubName({ currentClub: { name: "Manchester City" } }), "Manchester City");
  assert.equal(resolveClubName({ clubStatusText: "Retired", currentClub: null }), null);
  assert.equal(resolveClubName({ currentClub: { name: "Without Club" } }), null);
  assert.equal(resolveClubName({ currentClub: { name: "Unknown" } }), null);
});

// ---------------------------------------------------------------------------
// Fee status from source strings
// ---------------------------------------------------------------------------

test("feeStatusFromTmFee maps raw TM fee strings", () => {
  assert.deepEqual(feeStatusFromTmFee("€60.00m"), { feeStatus: "disclosed", feeEur: 60_000_000 });
  assert.deepEqual(feeStatusFromTmFee("€500k"), { feeStatus: "disclosed", feeEur: 500_000 });
  assert.deepEqual(feeStatusFromTmFee("?"), { feeStatus: "undisclosed", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("-"), { feeStatus: "not_recorded", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee(""), { feeStatus: "not_recorded", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee(null), { feeStatus: "not_recorded", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("End of loan"), { feeStatus: "loan_return", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("free transfer"), { feeStatus: "free", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("Loan fee:€2.00m"), { feeStatus: "loan_fee", feeEur: 2_000_000 });
  assert.deepEqual(feeStatusFromTmFee("loan transfer"), { feeStatus: "loan", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("Loan fee:?"), { feeStatus: "loan", feeEur: null });
  assert.deepEqual(feeStatusFromTmFee("€0"), { feeStatus: "not_recorded", feeEur: null });
});

test("feeStatusFromDb and formatFeeLabel", () => {
  assert.equal(feeStatusFromDb(5_000_000), "disclosed");
  assert.equal(feeStatusFromDb("5000000"), "disclosed");
  assert.equal(feeStatusFromDb(0), "not_recorded");
  assert.equal(feeStatusFromDb(null), "not_recorded");

  assert.deepEqual(formatFeeLabel("disclosed", 60_000_000), { label: "€60M", isAmount: true });
  assert.deepEqual(formatFeeLabel("loan_fee", 2_000_000), { label: "Loan, €2M fee", isAmount: false });
  assert.deepEqual(formatFeeLabel("loan", null), { label: "Loan", isAmount: false });
  assert.deepEqual(formatFeeLabel("loan_return", null), { label: "End of loan", isAmount: false });
  assert.deepEqual(formatFeeLabel("free", null), { label: "Free transfer", isAmount: false });
  assert.deepEqual(formatFeeLabel("undisclosed", null), { label: "Fee undisclosed", isAmount: false });
  assert.deepEqual(formatFeeLabel("not_recorded", null), { label: "—", isAmount: false, srLabel: "No fee recorded" });
  assert.deepEqual(formatFeeLabel("disclosed", null), { label: "—", isAmount: false, srLabel: "No fee recorded" });
});

// ---------------------------------------------------------------------------
// Transfermarkt client mapping (network stubbed)
// ---------------------------------------------------------------------------

function tmStub(raw: any) {
  return (url: string) => {
    if (url.includes("/ceapi/marketValueDevelopment/graph/")) return json(raw.graph);
    if (url.includes("/ceapi/transferHistory/list/")) return json(raw.transfers);
    if (url.includes("/profil/spieler/")) return new Response(raw.html, { status: 200 });
    return new Response("", { status: 404 });
  };
}

test("tmGetPlayer: nulls instead of 'Unknown', fee statuses, invalid and future transfers dropped", async () => {
  const raw = fixture("tm-raw-signed");
  const p: any = await withFetch(tmStub(raw), () => tmGetPlayer("erling-haaland-418560"));
  assert.ok(p);
  assert.equal(p.fullName, "Erling Haaland");
  assert.equal(p.position, "Centre-Forward");
  assert.equal(p.clubStatusText, null);
  assert.equal(p.currentClub.name, "Manchester City");
  assert.equal(p.currentClub.id, "281");
  assert.equal(p.contractUntil, "30/06/2034");
  assert.equal(p.heightCm, 195);
  assert.deepEqual(
    p.transfers.map((t: any) => [t.date.slice(0, 10), t.feeStatus, t.feeEur, t.transferType]),
    [
      ["2022-07-01", "disclosed", 60_000_000, "permanent"],
      ["2019-01-01", "undisclosed", null, "permanent"],
      ["2018-01-01", "not_recorded", null, "permanent"],
      ["2017-06-30", "loan_return", null, "loan"],
      ["2016-01-01", "free", null, "free"],
      ["2015-07-01", "loan_fee", 2_000_000, "loan"],
      ["2015-01-01", "loan", null, "loan"],
    ]
  );
  assert.equal(p.transfers[4].fromClubName, "Bryne FK U19", "string club side supported");

  const vm = buildPlayerProfile(p, { now: NOW });
  assert.equal(vm.status.contractUntil, "2034-06-30T00:00:00.000Z");
  assert.equal(vm.status.kind, "signed");
  assert.equal(vm.club?.href, null, "TM club id is not a DB cuid");
});

test("tmGetPlayer: 'Without Club' header -> currentClub null, clubStatusText set, position null", async () => {
  const raw = fixture("tm-raw-free-agent");
  const p: any = await withFetch(tmStub(raw), () => tmGetPlayer("sample-unattached-100001"));
  assert.ok(p);
  assert.equal(p.currentClub, null);
  assert.equal(p.clubStatusText, "Without Club");
  assert.equal(p.position, null);
  const vm = buildPlayerProfile(p, { now: NOW });
  assert.equal(vm.status.kind, "free_agent");
  assert.equal(vm.club, null);
});

// ---------------------------------------------------------------------------
// Season stats (FotMob stubbed)
// ---------------------------------------------------------------------------

const fotmobPlayerData = {
  name: "Erling Haaland",
  careerHistory: {
    careerItems: {
      senior: {
        teamEntries: [
          {
            team: "Manchester City",
            seasonEntries: [
              {
                seasonName: "2025/2026",
                tournamentStats: [
                  { leagueId: 47, leagueName: "Premier League", appearances: 30, goals: 25, assists: null, rating: { rating: 7.6 } },
                  { leagueId: 42, leagueName: null, appearances: 5, goals: 5 },
                ],
              },
            ],
          },
          { team: null, seasonEntries: [{ seasonName: "2024/2025", appearances: 3 }] },
          {
            team: "Borussia Dortmund",
            seasonEntries: [{ seasonName: "2021/2022", tournamentStats: [{ leagueId: 54, leagueName: "Bundesliga", appearances: 24, goals: 22, assists: 7 }] }],
          },
        ],
      },
    },
  },
};

function fotmobStub(delayMs = 0) {
  return async (url: string) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (url.includes("/search/suggest")) {
      return json([{ title: { key: "players" }, suggestions: [{ type: "player", id: 737066, name: "Erling Haaland" }] }]);
    }
    if (url.includes("/playerData")) return json(fotmobPlayerData);
    return new Response("", { status: 404 });
  };
}

test("getProfileSeasonStats: verified FotMob rows keep nulls and skip placeholder rows", async () => {
  const rows = await withFetch(fotmobStub(), () =>
    getProfileSeasonStats({ dbRows: [], lookupName: "Erling Haaland", verifyClubName: "Manchester City FC" })
  );
  assert.ok(rows);
  assert.equal(rows.length, 2, "row without competition and team without name skipped");
  const pl = rows.find((r) => r.competition === "Premier League");
  assert.equal(pl?.assists, null, "missing assists stay null");
  assert.equal(pl?.goals, 25);
  assert.equal(pl?.rating, 7.6);
  assert.equal(pl?.minutesPlayed, null);
});

test("getProfileSeasonStats: unverified club, no club, DB rows and timeouts", async () => {
  const mismatch = await withFetch(fotmobStub(), () =>
    getProfileSeasonStats({ dbRows: [], lookupName: "Erling Haaland", verifyClubName: "Liverpool FC" })
  );
  assert.equal(mismatch, null, "latest season's team must match the current club");

  let called = false;
  const noClub = await withFetch(
    () => {
      called = true;
      return json([]);
    },
    () => getProfileSeasonStats({ dbRows: [], lookupName: "Erling Haaland", verifyClubName: null })
  );
  assert.equal(noClub, null);
  assert.equal(called, false, "no FotMob call without a club to verify");

  const dbRows: SeasonStatRow[] = [
    { season: "2025/2026", competition: "Premier League", clubName: "Man City", appearances: 1, goals: null, assists: null, minutesPlayed: null, yellowCards: null, redCards: null, rating: null },
  ];
  assert.equal(await getProfileSeasonStats({ dbRows, lookupName: "x", verifyClubName: "y" }), dbRows);

  const slow = await withFetch(fotmobStub(150), async () => {
    const result = await getProfileSeasonStats(
      { dbRows: [], lookupName: "Erling Haaland", verifyClubName: "Manchester City" },
      { timeoutMs: 20 }
    );
    // Let the abandoned request settle while the stub is still installed.
    await new Promise((r) => setTimeout(r, 800));
    return result;
  });
  assert.equal(slow, null, "timeout returns null");

  const failing = await withFetch(
    () => {
      throw new Error("network down");
    },
    () => getProfileSeasonStats({ dbRows: [], lookupName: "Erling Haaland", verifyClubName: "Manchester City" })
  );
  assert.equal(failing, null);
});

test("season helpers: start years, club matching and verification", () => {
  assert.equal(seasonStartYear("2025/2026"), 2025);
  assert.equal(seasonStartYear("2025/26"), 2025);
  assert.equal(seasonStartYear("25/26"), 2025);
  assert.equal(seasonStartYear("2025"), 2025);
  assert.equal(seasonStartYear("Current"), null);
  assert.ok(clubNamesMatch("Manchester City", "Man City"));
  assert.ok(clubNamesMatch("FC Barcelona", "Barcelona"));
  assert.ok(clubNamesMatch("Atlético de Madrid", "Atletico de Madrid"));
  assert.ok(!clubNamesMatch("Manchester City", "Manchester United"));
  assert.ok(!clubNamesMatch(null, "Arsenal"));

  const row = (season: string, clubName: string): SeasonStatRow => ({
    season, competition: "League", clubName, appearances: 1, goals: 0, assists: 0, minutesPlayed: null, yellowCards: null, redCards: null, rating: null,
  });
  // An old match with the current club does not verify when the latest season is elsewhere.
  assert.equal(verifyFotmobRows([row("2019/2020", "Arsenal FC"), row("25/26", "Chelsea FC")], "Arsenal FC"), null);
  assert.equal(verifyFotmobRows([row("2019/2020", "Chelsea FC"), row("2025", "Arsenal FC")], "Arsenal")?.length, 2);
  assert.equal(verifyFotmobRows([], "Arsenal"), null);
});

// ---------------------------------------------------------------------------
// Related news (RSS stubbed)
// ---------------------------------------------------------------------------

const rss = `<?xml version="1.0"?><rss><channel>
<item><title>Erling Haaland scores twice as City cruise past Brentford</title><link>https://news.example/haaland-brace</link><description>Report</description><pubDate>Thu, 08 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>Manchester City confirm record kit partnership with sponsor</title><link>https://news.example/city-kit</link><description>Commercial</description><pubDate>Wed, 07 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>Arsenal weigh up pricey move for winger this January</title><link>https://news.example/arsenal-winger</link><description>Rumour</description><pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

test("getRelatedNews: multi-word names match normalised titles and matchedOn is reported", async () => {
  const stub = () => new Response(rss, { status: 200 });
  const grouped = await withFetch(stub, () =>
    getRelatedNews({ player: ["Erling Haaland"], club: ["Manchester City"] }, 3)
  );
  assert.deepEqual(
    grouped.map((i) => [i.url, i.matchedOn]),
    [
      ["https://news.example/haaland-brace", "player"],
      ["https://news.example/city-kit", "club"],
    ]
  );

  const legacy = await withFetch(stub, () => getRelatedNews(["Manchester City"], 3));
  assert.deepEqual(legacy.map((i) => i.url), ["https://news.example/city-kit"]);
  assert.equal(legacy[0].matchedOn, undefined, "array form keeps the old item shape");

  const none = await withFetch(stub, () => getRelatedNews({ player: ["Rice"], club: [] }, 3));
  assert.deepEqual(none, [], "whole-word match: 'Rice' does not match 'pricey'");
});
