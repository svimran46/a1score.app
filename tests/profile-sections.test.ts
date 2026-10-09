import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TransfersSection } from "../src/components/TransfersTable";
import { InjuriesSection } from "../src/components/InjuriesTable";
import { ProfileFactsSection, profileFacts } from "../src/components/KeyFacts";
import { HonoursSection, rankHonours, HONOURS_INLINE_MAX } from "../src/components/players/HonoursSection";
import { NewsSection } from "../src/components/news/RelatedNewsCard";
import type { PlayerProfileVM, ProfileTransfer } from "../src/lib/data/playerProfile.types";
import type { PlayerAchievementItem, PlayerAchievementsGrouped } from "../src/lib/data/playerAchievements";
import type { NewsItem } from "../src/types/news";

// Hand-built VMs: these tests pin each section's rendering rules, not the builder.
function makeVM(over: Partial<PlayerProfileVM> = {}, identity: Partial<PlayerProfileVM["identity"]> = {}): PlayerProfileVM {
  return {
    identity: {
      key: "418560",
      dbId: "cabcdefghijklmnopqrstuvwx",
      slug: "erling-haaland",
      displayName: "Erling Haaland",
      fullName: "Erling Haaland",
      photoUrl: null,
      dob: null,
      age: null,
      nationality: null,
      heightCm: null,
      preferredFoot: null,
      position: null,
      alsoPlays: null,
      ...identity,
    },
    club: {
      name: "Manchester City",
      shortName: "Man City",
      logoUrl: null,
      href: null,
      league: null,
    },
    status: { kind: "signed", contractUntil: null, contractMonthsLeft: null, parentClub: null, activeInjury: null },
    valuation: {
      points: [],
      current: null,
      staleness: "unknown",
      label: "Market value",
      sincePrevious: null,
      twelveMonth: null,
      peak: null,
      first: null,
    },
    transfers: [],
    transferSummary: null,
    honours: null,
    injuries: [],
    news: null,
    season: { dbRows: [], lookupName: "Erling Haaland", verifyClubName: null },
    ...over,
  };
}

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const textOf = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");

function honour(i: number, over: Partial<PlayerAchievementItem> = {}): PlayerAchievementItem {
  return {
    id: `h${i}`,
    playerId: "p",
    kind: "team_honour",
    competitionKey: `cup_${i}`,
    competitionName: `Cup ${i}`,
    titleCount: 1,
    seasons: ["24/25"],
    clubContext: [],
    source: "test",
    fetchedAt: null,
    ...over,
  };
}

function grouped(items: PlayerAchievementItem[]): PlayerAchievementsGrouped {
  return {
    majorHonours: items.filter((i) => i.competitionKey.startsWith("league_")),
    domesticCupsAndOther: items.filter((i) => !i.competitionKey.startsWith("league_") && i.kind === "team_honour"),
    individualAwards: items.filter((i) => i.kind === "individual_award"),
    all: items,
    totalTitles: items.reduce((a, b) => a + b.titleCount, 0),
  };
}

function transfer(over: Partial<ProfileTransfer>): ProfileTransfer {
  return {
    id: "t1",
    date: "2022-07-01",
    fromName: "Borussia Dortmund",
    toName: "Manchester City",
    feeStatus: "disclosed",
    feeEur: 60_000_000,
    isYouth: false,
    valueThen: null,
    ...over,
  };
}

test("every section renders nothing when the VM has no data for it", () => {
  const vm = makeVM();
  for (const el of [
    React.createElement(TransfersSection, { vm }),
    React.createElement(InjuriesSection, { vm }),
    React.createElement(ProfileFactsSection, { vm }),
    React.createElement(HonoursSection, { vm }),
    React.createElement(NewsSection, { vm }),
  ]) {
    assert.equal(html(el), "");
  }
});

test("honours: zero titles is hidden, majors rank first, short lists have no disclosure", () => {
  assert.equal(html(React.createElement(HonoursSection, { vm: makeVM({ honours: grouped([]) }) })), "");

  const items = [honour(1, { titleCount: 3 }), honour(2, { competitionKey: "league_epl", competitionName: "Premier League", titleCount: 1 })];
  assert.deepEqual(rankHonours(items).map((i) => i.competitionName), ["Premier League", "Cup 1"]);

  const out = html(React.createElement(HonoursSection, { vm: makeVM({ honours: grouped(items) }) }));
  assert.match(out, /id="honours"/);
  assert.match(textOf(out), /4 titles/);
  assert.ok(!out.includes("<details"), "no disclosure for a short list");
});

test("honours: long lists show a capped list plus an 'All honours' disclosure", () => {
  const items = Array.from({ length: HONOURS_INLINE_MAX + 2 }, (_, i) => honour(i + 1));
  const out = html(React.createElement(HonoursSection, { vm: makeVM({ honours: grouped(items) }) }));
  assert.match(textOf(out), new RegExp(`All honours \\(${items.length}\\)`));
  assert.ok(out.includes("<details"));
});

test("news: heading says when every story only mentions the club, and caps at 3", () => {
  const item = (id: string): NewsItem =>
    ({ id, title: `Story ${id}`, url: `https://example.com/${id}`, source: "Example", publishedAt: "2026-10-01T00:00:00Z" }) as NewsItem;
  const items = ["a", "b", "c", "d"].map(item);

  const clubOnly = html(React.createElement(NewsSection, { vm: makeVM({ news: { items, scope: "club" } }) }));
  assert.match(textOf(clubOnly), /News mentioning Man City/);
  assert.equal((clubOnly.match(/Read story:/g) || []).length, 3);

  const player = html(React.createElement(NewsSection, { vm: makeVM({ news: { items, scope: "player" } }) }));
  assert.ok(!textOf(player).includes("mentioning"));
});

test("transfers: unknown fees are never shown as free", () => {
  const vm = makeVM({
    transfers: [
      transfer({ id: "a" }),
      transfer({ id: "b", date: "2020-01-01", feeStatus: "undisclosed", feeEur: null, fromName: "Salzburg", toName: "Borussia Dortmund" }),
      transfer({ id: "c", date: "2019-01-01", feeStatus: "not_recorded", feeEur: null, fromName: "Molde", toName: "Salzburg" }),
    ],
  });
  const out = textOf(html(React.createElement(TransfersSection, { vm })));
  assert.ok(!/free transfer/i.test(out), "unknown fees must not read as free");
  assert.match(out, /€60M/);
});

test("profile facts: unknown rows are omitted and fewer than two hides the section", () => {
  assert.deepEqual(profileFacts(makeVM()), []);
  assert.equal(html(React.createElement(ProfileFactsSection, { vm: makeVM({}, { nationality: "Norway" }) })), "");

  const vm = makeVM({}, { nationality: "Norway", heightCm: 195, preferredFoot: "LEFT" });
  const facts = profileFacts(vm);
  assert.deepEqual(facts.map((f) => f.label), ["Height", "Foot", "Nationality"]);
  assert.equal(facts.find((f) => f.label === "Foot")?.value, "Left");
  assert.ok(!html(React.createElement(ProfileFactsSection, { vm })).includes("Full name"));
});
