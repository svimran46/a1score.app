import { describe, expect, it } from "vitest";

import {
  dateKeyLabel,
  isFinishedStatus,
  isLiveStatus,
  statusChip,
  toDateKey,
} from "./match-status";

describe("isLiveStatus", () => {
  it("treats in-play halves as live", () => {
    expect(isLiveStatus("1H")).toBe(true);
    expect(isLiveStatus("2H")).toBe(true);
    expect(isLiveStatus("HT")).toBe(true);
    expect(isLiveStatus("ET")).toBe(true);
  });

  it("does not treat finished or scheduled as live", () => {
    expect(isLiveStatus("FT")).toBe(false);
    expect(isLiveStatus("NS")).toBe(false);
    expect(isLiveStatus("PST")).toBe(false);
  });
});

describe("isFinishedStatus", () => {
  it("recognizes all finished variants", () => {
    expect(isFinishedStatus("FT")).toBe(true);
    expect(isFinishedStatus("AET")).toBe(true);
    expect(isFinishedStatus("PEN")).toBe(true);
    expect(isFinishedStatus("1H")).toBe(false);
  });
});

describe("statusChip", () => {
  it("shows the elapsed minute with live tone", () => {
    const chip = statusChip({ statusShort: "2H", elapsed: 67, date: "2026-09-23T20:00:00+00:00" });
    expect(chip).toEqual({ label: "67'", tone: "live" });
  });

  it("shows HT without a minute", () => {
    const chip = statusChip({ statusShort: "HT", elapsed: 45, date: "2026-09-23T20:00:00+00:00" });
    expect(chip.label).toBe("HT");
    expect(chip.tone).toBe("live");
  });

  it("shows FT with muted tone", () => {
    const chip = statusChip({ statusShort: "FT", elapsed: 90, date: "2026-09-23T20:00:00+00:00" });
    expect(chip).toEqual({ label: "FT", tone: "muted" });
  });

  it("shows kickoff time for not-started matches", () => {
    const chip = statusChip({ statusShort: "NS", elapsed: null, date: "2026-09-23T20:45:00+00:00" });
    expect(chip.tone).toBe("plain");
    expect(chip.label).toMatch(/^\d{2}:\d{2}$/);
  });

  it("labels postponed matches", () => {
    const chip = statusChip({ statusShort: "PST", elapsed: null, date: "2026-09-23T20:45:00+00:00" });
    expect(chip.label).toBe("Postponed");
  });

  it("falls back gracefully for an unparseable kickoff date", () => {
    const chip = statusChip({ statusShort: "NS", elapsed: null, date: "not-a-date" });
    expect(chip).toEqual({ label: "—", tone: "plain" });
  });
});

describe("date helpers", () => {
  it("formats local date keys with zero padding", () => {
    expect(toDateKey(new Date(2026, 8, 3))).toBe("2026-09-03");
  });

  it("labels today", () => {
    expect(dateKeyLabel(toDateKey(new Date()))).toBe("Today");
  });

  it("labels arbitrary dates", () => {
    expect(dateKeyLabel("2026-11-05")).toMatch(/Nov/);
  });
});
