import test from "node:test";
import assert from "node:assert/strict";
import { getClubDisplayName, getClubShortName } from "../src/lib/data/clubs";

test("D2: getClubDisplayName returns standard common names for all required clubs", () => {
  const testCases: [input: any, expected: string][] = [
    // 1. Roma
    ["Associazione Sportiva Roma", "Roma"],
    ["AS Roma", "Roma"],
    [{ name: "AS Roma" }, "Roma"],
    [{ name: "Roma" }, "Roma"],

    // 2. Brighton & Hove Albion
    ["Brighton and Hove Albion", "Brighton & Hove Albion"],
    ["Brighton & Hove Albion", "Brighton & Hove Albion"],
    ["Brighton &amp; Hove Albion", "Brighton & Hove Albion"],
    [{ name: "Brighton" }, "Brighton & Hove Albion"],

    // 3. Inter
    ["Football Club Internazionale Milano", "Inter"],
    ["FC Internazionale Milano", "Inter"],
    ["Inter Milan", "Inter"],
    [{ name: "Internazionale" }, "Inter"],
    [{ name: "Inter" }, "Inter"],

    // 4. Wolves
    ["Wolverhampton Wanderers", "Wolves"],
    ["Wolverhampton", "Wolves"],
    [{ name: "Wolves" }, "Wolves"],

    // 5. Spurs
    ["Tottenham Hotspur", "Spurs"],
    ["Tottenham Hotspur FC", "Spurs"],
    ["Tottenham", "Spurs"],
    [{ name: "Spurs" }, "Spurs"],

    // 6. Man City
    ["Manchester City", "Man City"],
    ["Manchester City FC", "Man City"],
    [{ name: "Man City" }, "Man City"],

    // 7. Man Utd
    ["Manchester United", "Man Utd"],
    ["Manchester United FC", "Man Utd"],
    ["Man United", "Man Utd"],
    [{ name: "Man Utd" }, "Man Utd"],

    // 8. Atletico Madrid
    ["Club Atlético de Madrid", "Atletico Madrid"],
    ["Club Atlético de Madrid S.A.D.", "Atletico Madrid"],
    ["Atlético de Madrid", "Atletico Madrid"],
    ["Atlético Madrid", "Atletico Madrid"],
    [{ name: "Atletico Madrid" }, "Atletico Madrid"],

    // 9. PSG
    ["Paris Saint-Germain", "PSG"],
    ["Paris Saint-Germain FC", "PSG"],
    ["Paris SG", "PSG"],
    [{ name: "PSG" }, "PSG"],
  ];

  for (const [input, expected] of testCases) {
    const actual = getClubDisplayName(input);
    assert.equal(
      actual,
      expected,
      `Expected input ${JSON.stringify(input)} to format as "${expected}", got "${actual}"`
    );
  }
});

test("D2: Ampersand renders correctly as '&' without literal '&amp;' entity artifacts", () => {
  const result = getClubDisplayName("Brighton &amp; Hove Albion");
  assert.equal(result, "Brighton & Hove Albion");
  assert.equal(result.includes("&amp;"), false);
  assert.equal(result.includes("&"), true);

  const customClub = getClubDisplayName("D&amp;G Football Club");
  assert.equal(customClub, "D&G FC");
  assert.equal(customClub.includes("&amp;"), false);
});

test("D2: getClubShortName aliases getClubDisplayName seamlessly", () => {
  assert.equal(getClubShortName("Manchester City"), "Man City");
  assert.equal(getClubShortName("Tottenham Hotspur"), "Spurs");
  assert.equal(getClubShortName("Wolverhampton Wanderers"), "Wolves");
});
