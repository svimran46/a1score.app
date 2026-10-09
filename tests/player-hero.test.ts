import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerHero } from "../src/components/players/PlayerHero";
import { ValueFigure } from "../src/components/players/ValueFigure";
import { TrendDelta } from "../src/components/players/TrendDelta";
import { playerShareCardModel, freshnessLine } from "../src/components/players/playerCardModel";
import { describeDelta } from "../src/lib/format-value";
import type { PlayerProfileVM } from "../src/lib/data/playerProfile.types";

// Hand-built VMs: these tests pin the hero's rendering rules, not the builder.
const NOW = new Date("2026-10-09T12:00:00Z");

function makeVM(over: {
  identity?: Partial<PlayerProfileVM["identity"]>;
  club?: PlayerProfileVM["club"];
  status?: Partial<PlayerProfileVM["status"]>;
  valuation?: Partial<PlayerProfileVM["valuation"]>;
} = {}): PlayerProfileVM {
  return {
    identity: {
      key: "418560",
      dbId: null,
      slug: "erling-haaland",
      displayName: "Erling Haaland",
      fullName: "Erling Braut Haaland",
      photoUrl: null,
      dob: "2000-07-21",
      age: 26,
      nationality: "Norway",
      heightCm: 195,
      preferredFoot: "left",
      position: "Centre-Forward",
      alsoPlays: null,
      ...over.identity,
    },
    club:
      over.club === undefined
        ? {
            name: "Manchester City",
            shortName: "Man City",
            logoUrl: null,
            href: "/clubs/manchester-city",
            league: { name: "Premier League", href: null },
          }
        : over.club,
    status: {
      kind: "signed",
      contractUntil: "2034-06-30",
      contractMonthsLeft: 92,
      parentClub: null,
      activeInjury: null,
      ...over.status,
    },
    valuation: {
      points: [
        { date: "2025-06-10", valueEur: 160_000_000, clubName: "Manchester City" },
        { date: "2026-08-12", valueEur: 180_000_000, clubName: "Manchester City" },
      ],
      current: { valueEur: 180_000_000, asOf: "2026-08-12" },
      staleness: "fresh",
      label: "Market value",
      sincePrevious: { diffEur: 20_000_000, pct: 12.5, basisDate: "2025-06-10" },
      twelveMonth: null,
      peak: null,
      first: null,
      ...over.valuation,
    },
    transfers: [],
    transferSummary: null,
    honours: null,
    injuries: [],
    news: null,
    season: { dbRows: [], lookupName: "Erling Haaland", verifyClubName: "Manchester City" },
  };
}

const render = (vm: PlayerProfileVM) =>
  renderToStaticMarkup(React.createElement(PlayerHero, { vm, canonicalUrl: "https://a1score.app/players/erling-haaland" }));

const textOf = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");

const FORBIDDEN = ["Review pending", "Unknown", "Free Agent", "Footballer", "Current Market Value", "Pending", "Stable (12m)"];

function assertHonest(html: string) {
  for (const s of FORBIDDEN) assert.ok(!html.includes(s), `must not render "${s}"`);
  assert.ok(!html.includes("undefined") && !html.includes(">null<"), "no literal undefined/null");
  assert.ok(!html.includes("−−") && !html.includes("--€"), "no double minus");
}

test("PlayerHero - landmark, name and exactly one market value figure", () => {
  const html = render(makeVM());
  assertHonest(html);
  assert.match(html, /<header[^>]*id="profile-hero"[^>]*aria-labelledby="player-name"/);
  assert.match(html, /<h1[^>]*id="player-name"[^>]*title="Erling Braut Haaland"[^>]*>Erling Haaland<\/h1>/);
  assert.equal(html.split("data-value-figure").length - 1, 1, "exactly one value figure");
  assert.equal(html.split("€180M").length - 1, 0, "the hero splits currency and suffix into spans");
  assert.ok(textOf(html).includes("€180M"), "the figure reads €180M");
  assert.ok(html.includes("180 million euros"), "sr-only spoken amount");
  assert.ok(html.includes("Valued 12 Aug 2026"), "fresh freshness line");
  assert.ok(html.includes("Contract") && html.includes("Jun 2034"), "contract block");
  assert.ok(html.includes("aria-pressed"), "Follow chip is a toggle button");
  assert.ok(html.includes('href="/compare?players=erling-haaland"'), "Compare link");
  assert.ok(html.includes("Man City") && html.includes('href="/clubs/manchester-city"'), "club link");
  assert.ok(html.includes("Age 26"), "age segment");
});

test("PlayerHero - change line carries arrow, sign, percentage and the 'since' basis", () => {
  const vm = makeVM();
  const html = render(vm);
  const d = describeDelta(vm.valuation.sincePrevious!);
  assert.ok(textOf(html).includes(d.text), `hero shows "${d.text}"`);
  assert.ok(textOf(html).includes("▲ +€20M (+12.5%) since Jun 2025"));
  assert.ok(html.includes("text-trend-up"));
  assert.ok(html.includes(d.spoken), "sr-only spoken sentence");
});

test("PlayerHero - falling value uses U+2212 and trend-down", () => {
  const html = render(makeVM({ valuation: { sincePrevious: { diffEur: -10_000_000, pct: -5.3, basisDate: "2025-06-10" } } }));
  assert.ok(textOf(html).includes("▼ −€10M (−5.3%) since Jun 2025"));
  assert.ok(html.includes("text-trend-down"));
  assertHonest(html);
});

test("PlayerHero - zero change reads 'Unchanged since' without trend colour", () => {
  const html = render(makeVM({ valuation: { sincePrevious: { diffEur: 0, pct: 0, basisDate: "2025-06-10" } } }));
  assert.ok(textOf(html).includes("Unchanged since Jun 2025"));
  assert.ok(!html.includes("text-trend-up") && !html.includes("text-trend-down"));
});

test("PlayerHero - stale value: 'Last market value', month-only date and no delta", () => {
  const html = render(
    makeVM({
      valuation: {
        current: { valueEur: 180_000_000, asOf: "2023-06-15" },
        staleness: "stale",
        label: "Last market value",
      },
    })
  );
  assert.ok(html.includes("Last market value"));
  assert.ok(html.includes("Valued Jun 2023"));
  assert.ok(!html.includes("since Jun 2025") && !html.includes("text-trend-"), "no change line");
  assertHonest(html);
});

test("PlayerHero - aging value states its age", () => {
  const vm = makeVM({ valuation: { current: { valueEur: 180_000_000, asOf: "2026-01-12" }, staleness: "aging" } });
  assert.equal(freshnessLine(vm, NOW), "Valued 12 Jan 2026 · 8 months ago");
});

test("PlayerHero - undated value: 'Valuation date not recorded' and no delta", () => {
  const html = render(
    makeVM({ valuation: { current: { valueEur: 180_000_000, asOf: null }, staleness: "unknown" } })
  );
  assert.ok(html.includes("Valuation date not recorded"));
  assert.ok(!html.includes("text-trend-"), "no change line without a date");
  assertHonest(html);
});

test("PlayerHero - no value: one muted line, no figure, no delta", () => {
  const html = render(
    makeVM({ valuation: { points: [], current: null, staleness: "unknown", sincePrevious: null } })
  );
  assert.ok(html.includes("No market value on record"));
  assert.ok(!html.includes("data-value-figure"), "no figure");
  assert.ok(!html.includes("€0") && !html.includes("Valued "), "no zero value, no freshness line");
  assert.ok(html.includes("Contract"), "the contract block stays");
  assertHonest(html);
});

test("PlayerHero - free agent status block, no club segment", () => {
  const html = render(makeVM({ club: null, status: { kind: "free_agent", contractUntil: null, contractMonthsLeft: null } }));
  assert.ok(html.includes("Status") && html.includes("Free agent"));
  assert.ok(!html.includes("Contract"));
  assertHonest(html);
});

test("PlayerHero - retired: 'Last market value', no delta, retired status", () => {
  const html = render(makeVM({ status: { kind: "retired", contractUntil: null, contractMonthsLeft: null } }));
  assert.ok(html.includes("Retired"));
  assert.ok(html.includes("Last market value"));
  assert.ok(!html.includes("text-trend-"));
  assertHonest(html);
});

test("PlayerHero - on loan: parent club, linked, with no loan end date", () => {
  const html = render(
    makeVM({
      status: {
        kind: "on_loan",
        contractUntil: null,
        contractMonthsLeft: null,
        parentClub: { name: "Chelsea FC", shortName: "Chelsea", logoUrl: null, href: "/clubs/chelsea" },
      },
    })
  );
  assert.ok(html.includes("On loan from"));
  assert.ok(html.includes('href="/clubs/chelsea"'));
  assertHonest(html);
});

test("PlayerHero - unknown position, age and club are dropped, never defaulted", () => {
  const html = render(
    makeVM({
      identity: { position: null, age: null, fullName: "Erling Haaland" },
      club: null,
      status: { kind: "unknown", contractUntil: null, contractMonthsLeft: null },
    })
  );
  assert.ok(!html.includes("Age "));
  assert.ok(!/<h1[^>]*title=/.test(html), "no title when fullName equals displayName");
  assertHonest(html);
});

test("PlayerHero - club without a DB page is plain text, not a link", () => {
  const html = render(
    makeVM({ club: { name: "Al-Hilal SFC", shortName: "Al-Hilal", logoUrl: null, href: null, league: null } })
  );
  assert.ok(html.includes("Al-Hilal"));
  assert.ok(!html.includes('href="/clubs/'));
});

test("ValueFigure - missing value is a muted dash with sr-only text", () => {
  const html = renderToStaticMarkup(React.createElement(ValueFigure, { eur: null, size: "md" }));
  assert.ok(html.includes("—") && html.includes("Market value unavailable") && html.includes("text-text-muted"));
  assert.ok(!html.includes("text-value-text"));
  const zero = renderToStaticMarkup(React.createElement(ValueFigure, { eur: 0, size: "sm" }));
  assert.ok(zero.includes("Market value unavailable") && !zero.includes("€0"));
});

test("TrendDelta - md and compact formats", () => {
  const delta = { diffEur: 20_000_000, pct: 12.5, basisDate: "2025-06-10" };
  const md = textOf(renderToStaticMarkup(React.createElement(TrendDelta, { delta, size: "md" })));
  assert.ok(md.startsWith("▲ +€20M +12.5%"), md);
  assert.ok(!md.includes("since Jun 2025") || md.includes("Up "), "md has no visual basis by default");
  const compact = renderToStaticMarkup(React.createElement(TrendDelta, { delta, size: "compact" }));
  assert.ok(textOf(compact).startsWith("▲ +12.5%"));
  assert.match(compact, /aria-hidden="true"/);
  const flat = renderToStaticMarkup(
    React.createElement(TrendDelta, { delta: { ...delta, diffEur: 0, pct: 0 }, size: "compact", basis: "none" })
  );
  assert.ok(textOf(flat).startsWith("Unchanged") && flat.includes("text-text-secondary"));
});

test("Share card - delta text equals the hero's describeDelta(...).text", () => {
  for (const sincePrevious of [
    { diffEur: 20_000_000, pct: 12.5, basisDate: "2025-06-10" },
    { diffEur: -10_000_000, pct: -5.3, basisDate: "2025-06-10" },
    { diffEur: 0, pct: 0, basisDate: "2025-06-10" },
  ]) {
    const vm = makeVM({ valuation: { sincePrevious } });
    const heroText = describeDelta(sincePrevious).text;
    const model = playerShareCardModel(vm, NOW);
    assert.equal(model.delta?.text, heroText);
    assert.equal(`${model.delta?.lead}${model.delta?.basis}`, heroText);
    assert.ok(textOf(render(vm)).includes(heroText), "the hero renders the same string");
  }
});

test("Share card - honest model: no value, stale and missing segments", () => {
  const none = playerShareCardModel(
    makeVM({ valuation: { current: null, sincePrevious: null, staleness: "unknown", points: [] } }),
    NOW
  );
  assert.equal(none.value, null);
  assert.equal(none.delta, null);
  assert.equal(none.freshness, null);

  const stale = playerShareCardModel(
    makeVM({ valuation: { current: { valueEur: 50_000_000, asOf: "2023-06-15" }, staleness: "stale", label: "Last market value" } }),
    NOW
  );
  assert.equal(stale.label, "Last market value");
  assert.equal(stale.delta, null);
  assert.equal(stale.freshness, "Valued Jun 2023");

  const bare = playerShareCardModel(makeVM({ identity: { position: null, photoUrl: null }, club: null }), NOW);
  assert.equal(bare.meta, null);
  assert.equal(bare.initials, "EH");
  assert.equal(playerShareCardModel(makeVM(), NOW).meta, "Centre-Forward · Manchester City");
});
