"use client";

/**
 * Browser-side fetch helpers. These ONLY ever call our own /api routes —
 * never api-sports.io directly (Section 2, hard constraint).
 */

/** Error shape our /api routes return for 429s; disables auto-retry. */
export class RateLimitError extends Error {
  constructor(public retryAfterSeconds?: number) {
    super("rate_limited");
    this.name = "RateLimitError";
  }
}

/** The JSON body our routes return on failures. */
interface ApiErrorBody {
  error?: { kind?: string; retryAfterSeconds?: number; messages?: string[] };
}

/** Fetch JSON from one of our own routes, translating failures to throws. */
export async function fetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Network error — check your connection.");
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new RateLimitError(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
  }

  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // ignore body parse issues
    }
    const messages = body.error?.messages;
    throw new Error(
      messages && messages.length > 0
        ? messages.join("; ")
        : `Request failed (HTTP ${res.status}).`,
    );
  }

  return (await res.json()) as T;
}
