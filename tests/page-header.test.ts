import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "../src/components/ui/PageHeader";

// Player cases moved to tests/player-hero.test.ts: players render PlayerHero.

test("PageHeader - is a server component with no player branch", () => {
  const src = fs.readFileSync(path.resolve(process.cwd(), "src/components/ui/PageHeader.tsx"), "utf-8");
  assert.ok(!src.includes('"use client"'), "PageHeader must not be a client component");
  assert.ok(!/\buse(State|Effect|Ref|Callback|Memo)\b/.test(src), "PageHeader must not use hooks");
  assert.ok(!src.includes('variant === "player"'), "The player variant branch is removed");
  assert.ok(!src.includes("Current Market Value"), "The player value label is removed");
});

test("PageHeader - renders with very long entity names with 2-line clamp", () => {
  const longName = "Sociedade Esportiva Palmeiras-Kromkamp-van-der-Vaart-Wildschut Extra Long Club Name For Testing";
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "club",
      entityType: "club",
      title: longName,
      value: "€450M",
      valueLabel: "Squad value",
      metaItems: ["Brazil", "28 Players"],
    })
  );

  assert.ok(html.includes(longName), "Should include full name in DOM for SEO/accessibility");
  assert.ok(html.includes("line-clamp-2"), "Title element should have line-clamp-2");
});

test("PageHeader - missing image renders fallback without layout shift", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "club",
      entityType: "club",
      title: "Newly Promoted FC",
      imageUrl: null,
      value: "€5M",
    })
  );

  assert.ok(
    html.includes("w-14 h-14 sm:w-16 sm:h-16"),
    "Image container must preserve fixed dimensions (56px / 64px) to prevent layout shift"
  );
  assert.ok(html.includes("<svg") || html.includes("lucide"), "Fallback icon must be rendered when imageUrl is absent");
});

test("PageHeader - missing valuation renders cleanly without empty gap", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "club",
      title: "Newly Promoted FC",
      value: null,
      valueLabel: "Squad Value",
      metaItems: ["Premier League", "25 Players"],
    })
  );

  assert.ok(html.includes("Newly Promoted FC"), "Renders club title");
  assert.ok(html.includes("Premier League"), "Renders meta items");
  assert.ok(!html.includes("null"), "Should not render literal null string");
  assert.ok(!html.includes("undefined"), "Should not render literal undefined string");
});

test("PageHeader - league value shows once per breakpoint (inline hidden where the side box shows)", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "league",
      entityType: "league",
      title: "Premier League",
      value: "€11.8B",
      valueLabel: "Total Competition Value",
    })
  );

  // Inline copy: visible below sm only. Side box: hidden below sm.
  assert.equal(html.split("€11.8B").length - 1, 2, "Value is rendered inline and in the side box");
  assert.match(html, /class="[^"]*\bsm:hidden\b[^"]*"><span[^>]*>€11\.8B/, "Inline value is hidden from sm up");
  assert.match(html, /class="hidden sm:flex[^"]*"/, "Side box only shows from sm up");
});

test("PageHeader - club value renders inline only (no side box)", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "club",
      entityType: "club",
      title: "Real Madrid",
      value: "€1.3B",
      valueLabel: "Total Squad Valuation",
    })
  );

  assert.equal(html.split("€1.3B").length - 1, 1, "Club value appears exactly once");
  assert.ok(!html.includes("sm:hidden"), "The only value copy is never hidden");
});

test("PageHeader - ensures no horizontal overflow constraints for 320px viewports", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "league",
      entityType: "league",
      title: "LaLiga",
      categoryLabel: "Spain • Tier 1",
      value: "€5.2B",
      valueLabel: "Total Competition Value",
      metaItems: [
        React.createElement("span", { key: 1 }, "20 Clubs"),
        React.createElement("span", { key: 2 }, "Season 2026/2027"),
      ],
      shareTitle: "LaLiga standings & valuations",
      shareUrl: "https://a1score.app/leagues/laliga",
    })
  );

  assert.ok(html.includes("max-w-full"), "Outer container must enforce max-w-full to prevent horizontal overflow");
  assert.ok(html.includes("overflow-hidden"), "Outer container must enforce overflow-hidden");
  assert.ok(html.includes("w-14"), "Visual anchor must be w-14 (56px) on mobile");
  assert.ok(html.includes("min-w-0"), "Text container must have min-w-0 to prevent flex item blowouts");
});

test("PageHeader - directory variant renders lightweight semantic heading", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "directory",
      categoryLabel: "Commercial Ledger",
      title: "Transfers",
      subtitle: "Worldwide confirmed transactions",
    })
  );

  assert.ok(html.includes("Commercial Ledger"), "Renders category label");
  assert.ok(html.includes("Transfers"), "Renders directory title");
  assert.ok(html.includes("Worldwide confirmed transactions"), "Renders subtitle");
  assert.ok(html.includes("<h1"), "Uses semantic h1");
});
