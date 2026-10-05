import { test } from "node:test";
import assert from "node:assert/strict";
import { deduplicateNews, normalizeHeadline, formatRelativeTime } from "../src/lib/data/news";

function item(over: Partial<any>): any {
  return {
    id: Math.random().toString(36).slice(2),
    title: "Arsenal agree deal for midfielder ahead of window",
    url: "https://example.com/a",
    source: "BBC Sport",
    publishedAt: "2026-10-01T10:00:00Z",
    tags: [],
    ...over,
  };
}

test("normalizeHeadline strips accents, punctuation and roundup prefixes", () => {
  assert.equal(normalizeHeadline("Papers: Mbappé’s future!"), "mbappe s future");
});

test("dedupes identical canonical URLs (tracking params ignored)", () => {
  const out = deduplicateNews([
    item({ url: "https://x.com/story?utm_source=a" }),
    item({ url: "https://x.com/story?utm_source=b", title: "Totally different headline text here" }),
  ]);
  assert.equal(out.length, 1);
});

test("dedupes near-identical titles across sources", () => {
  const out = deduplicateNews([
    item({ url: "https://a.com/1", source: "BBC Sport" }),
    item({ url: "https://b.com/2", source: "Sky Sports", title: "Arsenal agree deal for midfielder ahead of the January window" }),
  ]);
  assert.equal(out.length, 1);
});

test("caps items per source for regional balance", () => {
  const many = Array.from({ length: 20 }, (_, i) =>
    item({ url: `https://bbc.com/${i}`, title: `Unique headline number ${i} about football club ${i}` })
  );
  assert.equal(deduplicateNews(many, 8).length, 8);
});

test("labels Papers: roundups as Press Roundup", () => {
  const [out] = deduplicateNews([item({ title: "Papers: Chelsea weigh up striker move" })]);
  assert.ok(out.tags.includes("Press Roundup"));
});

test("drops generic headlines", () => {
  assert.equal(deduplicateNews([item({ title: "Latest news" })]).length, 0);
});

test("missing / invalid timestamps never fabricate 'Just now'", () => {
  assert.notEqual(formatRelativeTime(""), "Just now");
  assert.notEqual(formatRelativeTime("not-a-date"), "Just now");
});
