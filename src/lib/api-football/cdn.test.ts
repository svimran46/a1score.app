import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The cdn module reads a shared env object at call time, so tests mutate a
 * hoisted fake env that the mocked env-config module returns.
 */
const fakeEnv = vi.hoisted(() => ({
  apiKey: null as string | null,
  cdnBaseUrl: null as string | null,
  cdnMediaBaseUrl: null as string | null,
}));

vi.mock("./env-config", () => ({ env: fakeEnv }));

import {
  DEFAULT_BASE_URL,
  DEFAULT_MEDIA_BASE,
  isCdnMode,
  resolveBaseUrl,
  resolveMediaBase,
  rewriteMediaUrl,
  upstreamHeaders,
} from "./cdn";

beforeEach(() => {
  fakeEnv.apiKey = null;
  fakeEnv.cdnBaseUrl = null;
  fakeEnv.cdnMediaBaseUrl = null;
});

describe("resolveBaseUrl / isCdnMode", () => {
  it("uses the direct base URL when no CDN URL is configured", () => {
    expect(isCdnMode()).toBe(false);
    expect(resolveBaseUrl()).toBe(DEFAULT_BASE_URL);
  });

  it("uses the pull-zone URL in CDN mode", () => {
    fakeEnv.cdnBaseUrl = "https://my-zone.b-cdn.net/";
    expect(isCdnMode()).toBe(true);
    expect(resolveBaseUrl()).toBe("https://my-zone.b-cdn.net/");
  });
});

describe("upstreamHeaders", () => {
  it("sends the key header in direct mode", () => {
    fakeEnv.apiKey = "test-key-123";
    expect(upstreamHeaders()).toEqual({
      Accept: "application/json",
      "x-apisports-key": "test-key-123",
    });
  });

  it("never sends the key in CDN mode (edge rule injects it)", () => {
    fakeEnv.cdnBaseUrl = "https://my-zone.b-cdn.net/";
    fakeEnv.apiKey = "test-key-123";
    expect(upstreamHeaders()).toEqual({ Accept: "application/json" });
    expect(JSON.stringify(upstreamHeaders())).not.toContain("test-key-123");
  });

  it("omits the key header when no key is configured in direct mode", () => {
    expect(upstreamHeaders()).toEqual({ Accept: "application/json" });
  });
});

describe("rewriteMediaUrl", () => {
  it("returns null through for null input", () => {
    expect(rewriteMediaUrl(null)).toBeNull();
  });

  it("rewrites default media host to the configured media CDN", () => {
    fakeEnv.cdnMediaBaseUrl = "https://media-zone.b-cdn.net/";
    expect(rewriteMediaUrl("https://media.api-sports.io/football/teams/40.png")).toBe(
      "https://media-zone.b-cdn.net/football/teams/40.png",
    );
  });

  it("leaves URLs already on the media base untouched", () => {
    fakeEnv.cdnMediaBaseUrl = "https://media-zone.b-cdn.net/";
    expect(rewriteMediaUrl("https://media-zone.b-cdn.net/football/teams/40.png")).toBe(
      "https://media-zone.b-cdn.net/football/teams/40.png",
    );
  });

  it("passes default-host URLs through when no media CDN is set", () => {
    expect(rewriteMediaUrl("https://media.api-sports.io/flags/us.svg")).toBe(
      "https://media.api-sports.io/flags/us.svg",
    );
  });

  it("leaves unknown hosts untouched", () => {
    expect(rewriteMediaUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("exposes the media base resolution", () => {
    expect(resolveMediaBase()).toBe(DEFAULT_MEDIA_BASE);
    fakeEnv.cdnMediaBaseUrl = "https://media-zone.b-cdn.net/";
    expect(resolveMediaBase()).toBe("https://media-zone.b-cdn.net/");
  });
});
