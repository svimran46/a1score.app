import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EUR_CONTEXT, moneyContext, parseCurrency, parseEcbDailyXml } from "../src/lib/currency";
import { bindMoney } from "../src/lib/money";
import { formatCompactEur, formatEur } from "../src/lib/utils";
import { formatSignedEur, formatValueEur, spokenEur } from "../src/lib/format-value";
import { formatHeight, parseMeasurementSystem } from "../src/lib/units";
import { followedMatches, matchPassesFilter, matchesWithMappedClubs } from "../src/lib/matches/following";
import { Money } from "../src/components/ui/Money";
import type { FotmobLeagueGroup, FotmobMatch } from "../src/lib/fotmob/client";

// Trimmed from the real ECB daily file (2026-10-14).
const ECB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
	<Cube>
		<Cube time='2026-10-14'>
			<Cube currency='USD' rate='1.1195'/>
			<Cube currency='JPY' rate='177.39'/>
			<Cube currency='GBP' rate='0.84385'/>
		</Cube>
	</Cube>
</gesmes:Envelope>`;

test("parseEcbDailyXml reads the date and GBP/USD rates", () => {
  assert.deepEqual(parseEcbDailyXml(ECB_XML), { date: "2026-10-14", rates: { EUR: 1, GBP: 0.84385, USD: 1.1195 } });
  assert.equal(parseEcbDailyXml("<html>maintenance</html>"), null);
  assert.equal(parseEcbDailyXml(ECB_XML.replace(/<Cube currency='GBP'[^>]*>/, "")), null);
});

test("moneyContext falls back to euros without a usable rate", () => {
  const fx = parseEcbDailyXml(ECB_XML);
  assert.deepEqual(moneyContext("GBP", fx), { code: "GBP", symbol: "£", rate: 0.84385 });
  assert.equal(moneyContext("GBP", null), EUR_CONTEXT);
  assert.equal(moneyContext("USD", { date: "x", rates: { USD: 0 } }), EUR_CONTEXT);
  assert.equal(parseCurrency("JPY"), "EUR");
});

test("formatters are unchanged in euros and convert with a context", () => {
  const gbp = { code: "GBP" as const, symbol: "£", rate: 0.5 };
  assert.equal(formatCompactEur(180_000_000), "€180M");
  assert.equal(formatCompactEur(180_000_000, gbp), "£90M");
  assert.equal(formatCompactEur(0, gbp), "Free");
  assert.equal(formatCompactEur(-10_000_000, gbp), "-£5M");
  assert.equal(formatEur(2_000_000, gbp), "£1,000,000");
  assert.equal(formatValueEur(150_000_000, gbp), "£75M");
  assert.equal(formatSignedEur(-20_000_000, gbp), "−£10M");
  assert.equal(spokenEur(3_000_000, gbp), "1.5 million pounds");
  assert.equal(spokenEur(3_000_000), "3 million euros");
});

test("bindMoney delta text uses the display currency", () => {
  const money = bindMoney({ code: "USD", symbol: "$", rate: 2 });
  const d = money.delta({ diffEur: 10_000_000, pct: 12.5, basisDate: "2025-06-12" });
  assert.equal(d.text, "▲ +$20M (+12.5%) since Jun 2025");
  assert.match(d.spoken, /20 million dollars/);
  assert.equal(money.isConverted, true);
  assert.equal(bindMoney(EUR_CONTEXT).isConverted, false);
});

test("Money renders euros on the server (matching cached HTML)", () => {
  assert.equal(renderToStaticMarkup(React.createElement(Money, { eur: 180_000_000 })), "€180M");
  assert.equal(renderToStaticMarkup(React.createElement(Money, { eur: null, kind: "value" })), "—");
});

test("formatHeight converts centimetres to feet and inches", () => {
  assert.equal(formatHeight(183, "metric"), "183 cm");
  assert.equal(formatHeight(183, "imperial"), "6 ft 0 in");
  assert.equal(formatHeight(170, "imperial"), "5 ft 7 in");
  assert.equal(formatHeight(0, "imperial"), null);
  assert.equal(formatHeight(null, "metric"), null);
  assert.equal(parseMeasurementSystem("bogus"), "metric");
});

function match(id: number, home: number, away: number, timeTS: number, state: Partial<FotmobMatch> = {}): FotmobMatch {
  return {
    id,
    leagueId: 1,
    time: "",
    timeTS,
    home: { id: home, name: `T${home}` },
    away: { id: away, name: `T${away}` },
    status: { utcTime: new Date(timeTS).toISOString(), started: false, finished: false, cancelled: false },
    isLive: false,
    isFinished: false,
    isUpcoming: true,
    ...state,
  };
}

test("Following on Matches uses the exact FotMob → club id mapping", () => {
  const mappings = { 10: { clubId: "club-a" }, 20: { clubId: "club-b" }, 30: {} };
  const leagues: FotmobLeagueGroup[] = [
    { id: 1, name: "Premier League", ccode: "ENG", matches: [match(1, 10, 99, 2000), match(2, 30, 98, 1000)] },
    { id: 2, name: "Cup", ccode: "", matches: [match(3, 97, 20, 1500)] },
  ];
  const candidates = matchesWithMappedClubs(leagues, mappings);
  // Match 2's team has no clubId, so it is never a candidate.
  assert.deepEqual(candidates.map((c) => c.match.id), [3, 1]);
  assert.deepEqual(candidates.map((c) => [c.homeClubId, c.awayClubId]), [[null, "club-b"], ["club-a", null]]);

  assert.deepEqual(followedMatches(candidates, ["club-a"]).map((c) => c.match.id), [1]);
  assert.deepEqual(followedMatches(candidates, ["club-a", "club-b"]).map((c) => c.match.id), [3, 1]);
  assert.deepEqual(followedMatches(candidates, []), []);

  const live = match(4, 10, 20, 0, { isLive: true, isUpcoming: false });
  assert.equal(matchPassesFilter(live, "live"), true);
  assert.equal(matchPassesFilter(live, "upcoming"), false);
  assert.equal(matchPassesFilter(live, "all"), true);
});
