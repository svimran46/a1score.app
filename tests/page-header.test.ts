import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "../src/components/ui/PageHeader";

test("PageHeader - renders with very long entity names with 2-line clamp", () => {
  const longName = "Jan Vennegoor of Hesselink-Kromkamp-van-der-Vaart-Wildschut Extra Long Player Name For Testing";
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "player",
      title: longName,
      value: "€45M",
      valueLabel: "Estimated Value",
      metaItems: ["Forward", "Age 28"],
    })
  );

  // Verifies the long name is contained
  assert.ok(html.includes(longName), "Should include full name in DOM for SEO/accessibility");
  // Verifies line-clamp-2 is applied to prevent vertical blowout
  assert.ok(html.includes("line-clamp-2"), "Title element should have line-clamp-2");
});

test("PageHeader - missing image renders fallback without layout shift", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "player",
      title: "Unknown Prospect",
      imageUrl: null,
      value: "€5M",
    })
  );

  // Verifies exact container dimensions to guarantee Zero CLS (56px mobile / 64px desktop)
  assert.ok(
    html.includes("w-14 h-14 sm:w-16 sm:h-16"),
    "Image container must preserve fixed dimensions (56px / 64px) to prevent layout shift"
  );
  // Verifies fallback icon or SVG is rendered
  assert.ok(
    html.includes("<svg") || html.includes("lucide"),
    "Fallback icon must be rendered when imageUrl is absent"
  );
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
  // Should not contain null or undefined text
  assert.ok(!html.includes("null"), "Should not render literal null string");
  assert.ok(!html.includes("undefined"), "Should not render literal undefined string");
});

test("PageHeader - ensures no horizontal overflow constraints for 320px viewports", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      variant: "player",
      title: "Kylian Mbappé Lottin",
      categoryLabel: "Real Madrid • Forward",
      value: "€180M",
      valueLabel: "Market Value Update",
      metaItems: [
        React.createElement("span", { key: 1 }, "Real Madrid"),
        React.createElement("span", { key: 2 }, "LaLiga"),
        React.createElement("span", { key: 3 }, "France"),
        React.createElement("span", { key: 4 }, "Age 27"),
      ],
      shareTitle: "Kylian Mbappe market value",
      shareUrl: "https://a1score.app/players/kylian-mbappe",
    })
  );

  // Container must have max-w-full and overflow-hidden
  assert.ok(html.includes("max-w-full"), "Outer container must enforce max-w-full to prevent horizontal overflow");
  assert.ok(html.includes("overflow-hidden"), "Outer container must enforce overflow-hidden");
  // Visual anchor is fixed at 56px (w-14)
  assert.ok(html.includes("w-14"), "Visual anchor must be w-14 (56px) on mobile");
  // Min-w-0 on flex children to allow text truncation / wrapping
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
