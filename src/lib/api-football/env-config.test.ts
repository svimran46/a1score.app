import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * env-config parses process.env at module load, so each case re-imports
 * the module with a fresh env via vi.resetModules().
 */
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.stubEnv("API_FOOTBALL_KEY", env.API_FOOTBALL_KEY ?? "");
  vi.stubEnv("API_FOOTBALL_CDN_URL", env.API_FOOTBALL_CDN_URL ?? "");
  vi.stubEnv("API_FOOTBALL_CDN_MEDIA_URL", env.API_FOOTBALL_CDN_MEDIA_URL ?? "");
  return import("./env-config");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env-config", () => {
  it("normalizes the CDN URL with scheme and trailing slash", async () => {
    const { env } = await loadWith({ API_FOOTBALL_CDN_URL: "my-zone.b-cdn.net" });
    expect(env.cdnBaseUrl).toBe("https://my-zone.b-cdn.net/");
  });

  it("keeps an existing trailing slash", async () => {
    const { env } = await loadWith({ API_FOOTBALL_CDN_URL: "https://my-zone.b-cdn.net/" });
    expect(env.cdnBaseUrl).toBe("https://my-zone.b-cdn.net/");
  });

  it("rejects plain-http URLs", async () => {
    const { env } = await loadWith({ API_FOOTBALL_CDN_URL: "http://my-zone.b-cdn.net" });
    expect(env.cdnBaseUrl).toBeNull();
  });

  it("rejects unparseable values and falls back to direct mode", async () => {
    const { env } = await loadWith({ API_FOOTBALL_CDN_URL: "https://bad host.example" });
    expect(env.cdnBaseUrl).toBeNull();
  });

  it("treats empty strings as unset", async () => {
    const { env } = await loadWith({ API_FOOTBALL_CDN_URL: "  " });
    expect(env.cdnBaseUrl).toBeNull();
  });

  it("parses the media URL the same way", async () => {
    const { env } = await loadWith({
      API_FOOTBALL_CDN_MEDIA_URL: "https://media-zone.b-cdn.net",
    });
    expect(env.cdnMediaBaseUrl).toBe("https://media-zone.b-cdn.net/");
  });

  it("keeps the API key trimmed, or null when blank", async () => {
    const withKey = await loadWith({ API_FOOTBALL_KEY: "  k-123  " });
    expect(withKey.env.apiKey).toBe("k-123");
    const blank = await loadWith({ API_FOOTBALL_KEY: "   " });
    expect(blank.env.apiKey).toBeNull();
  });
});
