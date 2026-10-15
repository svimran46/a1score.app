import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFotmobTvListings, parseDotNetDate } from "../src/lib/tv/fotmobProvider";
import { groupByLocalDay } from "../src/lib/tv/days";
import { countryFromLocales, isTvCountry } from "../src/lib/tv/countries";
import type { TvListing } from "../src/lib/tv/types";

const row = (matchId: number, ms: number, station: string, type: string, qualifiers: string[] = ["Live"]) => ({
  startTime: `/Date(${ms})/`,
  endTime: "/Date(-62135596800000)/",
  qualifiers,
  station: { name: station, type },
  matchId,
  program: {
    teams: [
      { name: "FC Cincinnati", isHome: true, teamBrandId: "722265" },
      { name: "DC United", isHome: false, teamBrandId: "6602" },
    ],
  },
});

test("parseDotNetDate reads /Date(ms)/ and rejects placeholders", () => {
  assert.equal(parseDotNetDate("/Date(1792623600000)/"), 1792623600000);
  assert.equal(parseDotNetDate("/Date(-62135596800000)/"), null);
  assert.equal(parseDotNetDate(undefined), null);
});

test("normalizeFotmobTvListings merges channels per match and sorts by start", () => {
  const payload = {
    "2": [row(2, 2_000_000_000_000, "Sky Sports", "TV"), row(2, 2_000_000_000_000, "Sky Sports", "TV"), row(2, 2_000_000_000_000, "NOW", "Stream", [])],
    "1": [row(1, 1_900_000_000_000, "Apple TV (UK)", "Stream")],
    "3": [{ ...row(3, 1_950_000_000_000, "X", "TV"), program: { teams: [] } }], // no teams: dropped
    "4": [{ ...row(4, 0, "Y", "TV"), startTime: "/Date(-1)/" }], // no start: dropped
    "5": "not an array",
  };
  const out = normalizeFotmobTvListings(payload);
  assert.deepEqual(out.map((l) => l.matchId), ["1", "2"]);
  assert.deepEqual(out[1].channels, [
    { name: "Sky Sports", kind: "tv" },
    { name: "NOW", kind: "stream" },
  ]);
  assert.equal(out[1].live, true);
  assert.equal(out[0].home.name, "FC Cincinnati");
  assert.equal(out[0].away.id, "6602");
  // Crests go through the image proxy, which base64-encodes the source URL.
  const logo = out[0].home.logoUrl ?? "";
  assert.match(logo, /^\/img\/asset\//);
  assert.match(Buffer.from(logo.replace("/img/asset/", ""), "base64").toString(), /teamlogo\/722265_small\.png$/);
  assert.deepEqual(normalizeFotmobTvListings(null), []);
});

function listing(id: string, iso: string): TvListing {
  return {
    matchId: id,
    startTime: iso,
    live: true,
    channels: [{ name: "C", kind: "tv" }],
    home: { name: "H", id: null, logoUrl: null },
    away: { name: "A", id: null, logoUrl: null },
  };
}

test("groupByLocalDay uses the viewer's timezone and hides finished broadcasts", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const items = [
    listing("old", "2026-10-15T07:00:00Z"), // 5h ago: finished
    listing("now", "2026-10-15T11:00:00Z"),
    listing("late", "2026-10-15T23:30:00Z"), // 16 Oct in Kuala Lumpur (UTC+8)
    listing("sat", "2026-10-17T19:00:00Z"),
  ];
  const utc = groupByLocalDay(items, now, "UTC");
  assert.deepEqual(utc.map((d) => [d.label, d.listings.map((l) => l.matchId)]), [
    ["Today", ["now", "late"]],
    ["Sat 17 Oct", ["sat"]],
  ]);
  const kl = groupByLocalDay(items, now, "Asia/Kuala_Lumpur");
  assert.deepEqual(kl.map((d) => [d.label, d.listings.map((l) => l.matchId)]), [
    ["Today", ["now"]],
    ["Tomorrow", ["late"]],
    ["Sun 18 Oct", ["sat"]],
  ]);
});

test("countryFromLocales picks a supported region or falls back to GB", () => {
  assert.equal(countryFromLocales(["ms-MY", "en"]), "MY");
  assert.equal(countryFromLocales(["en", "fr-FR"]), "FR");
  assert.equal(countryFromLocales(["en-KE"]), "GB");
  assert.equal(isTvCountry("DK"), false);
});
