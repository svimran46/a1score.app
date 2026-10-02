import test from "node:test";
import assert from "node:assert/strict";
import { watchlistAdapter, WatchlistItem } from "../src/lib/watchlist/storage";

test("WatchlistAdapter - basic add, check, remove, and clear operations", () => {
  // Clear any existing state
  watchlistAdapter.clearFavorites();
  assert.equal(watchlistAdapter.getFavorites().length, 0);

  // 1. Add player
  const playerItem = {
    id: "p1",
    type: "player" as const,
    name: "Lamine Yamal",
    slug: "lamine-yamal-1051588",
    avatarUrl: "https://example.com/yamal.jpg",
    clubName: "FC Barcelona",
    position: "Right Winger",
    currentValueEur: 180000000,
    initialValueEur: 150000000,
  };

  watchlistAdapter.addFavorite(playerItem);
  assert.equal(watchlistAdapter.isFavorite("p1", "player"), true);
  assert.equal(watchlistAdapter.isFavorite("p1", "club"), false);
  assert.equal(watchlistAdapter.getFavorites().length, 1);

  const storedPlayer = watchlistAdapter.getFavorites()[0];
  assert.equal(storedPlayer.name, "Lamine Yamal");
  assert.equal(storedPlayer.initialValueEur, 150000000);
  assert.equal(storedPlayer.currentValueEur, 180000000);
  assert.ok(storedPlayer.savedAt, "savedAt ISO timestamp must be set");

  // 2. Add club
  const clubItem = {
    id: "c1",
    type: "club" as const,
    name: "Arsenal FC",
    slug: "arsenal-fc",
    clubCrest: "https://example.com/arsenal.png",
    currentValueEur: 1150000000,
  };

  watchlistAdapter.addFavorite(clubItem);
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), true);
  assert.equal(watchlistAdapter.getFavorites().length, 2);

  // 3. Clear only players
  watchlistAdapter.clearFavorites("player");
  assert.equal(watchlistAdapter.isFavorite("p1", "player"), false);
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), true);
  assert.equal(watchlistAdapter.getFavorites().length, 1);

  // 4. Remove club
  watchlistAdapter.removeFavorite("c1", "club");
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), false);
  assert.equal(watchlistAdapter.getFavorites().length, 0);
});

test("WatchlistAdapter - subscriber notifications on mutation", () => {
  watchlistAdapter.clearFavorites();
  let callCount = 0;

  const unsubscribe = watchlistAdapter.subscribe(() => {
    callCount++;
  });

  watchlistAdapter.addFavorite({
    id: "test-player",
    type: "player",
    name: "Test Player",
  });
  assert.equal(callCount, 1);

  watchlistAdapter.removeFavorite("test-player", "player");
  assert.equal(callCount, 2);

  unsubscribe();
  watchlistAdapter.addFavorite({
    id: "test-player-2",
    type: "player",
    name: "Test Player 2",
  });
  // Should not increment after unsubscribe
  assert.equal(callCount, 2);

  watchlistAdapter.clearFavorites();
});

test("Watchlist - Value change calculation logic", () => {
  function computeChange(initialVal: number, currentVal: number) {
    const diff = currentVal - initialVal;
    const isPos = diff >= 0;
    const hasChange = diff !== 0 && initialVal > 0;
    const pct = initialVal > 0 ? ((diff / initialVal) * 100).toFixed(1) : "0.0";
    return { diff, isPos, hasChange, pct };
  }

  // Case 1: Increased value
  const up = computeChange(100_000_000, 120_000_000);
  assert.equal(up.diff, 20_000_000);
  assert.equal(up.isPos, true);
  assert.equal(up.hasChange, true);
  assert.equal(up.pct, "20.0");

  // Case 2: Decreased value
  const down = computeChange(100_000_000, 80_000_000);
  assert.equal(down.diff, -20_000_000);
  assert.equal(down.isPos, false);
  assert.equal(down.hasChange, true);
  assert.equal(down.pct, "-20.0");

  // Case 3: Same value
  const same = computeChange(100_000_000, 100_000_000);
  assert.equal(same.diff, 0);
  assert.equal(same.isPos, true);
  assert.equal(same.hasChange, false);
  assert.equal(same.pct, "0.0");

  // Case 4: Initial 0 edge case
  const zeroInit = computeChange(0, 50_000_000);
  assert.equal(zeroInit.diff, 50_000_000);
  assert.equal(zeroInit.hasChange, false);
  assert.equal(zeroInit.pct, "0.0");
});
