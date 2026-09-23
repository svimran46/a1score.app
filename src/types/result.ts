/**
 * Application-wide error taxonomy and Result wrapper.
 * Every lib/api-football fetcher returns `Promise<Result<T>>` (Section 11).
 */

export type AppError =
  | { kind: "network" }
  | { kind: "rate_limited"; retryAfterSeconds?: number }
  | { kind: "timeout" }
  | { kind: "api_error"; messages: string[] }
  | { kind: "validation"; issues: string[] }
  | { kind: "http"; status: number }
  | { kind: "unknown" };

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

/** Build a success Result. */
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

/** Build a failure Result from an AppError. */
export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}

/** Convert any thrown value into a best-effort AppError. */
export function describeError(value: unknown): AppError {
  if (value instanceof Error) {
    if (value.name === "AbortError") return { kind: "timeout" };
    if (value.message.includes("fetch failed") || value.message.includes("NetworkError")) {
      return { kind: "network" };
    }
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}

/** Human-readable message for showing an AppError in the UI. */
export function errorMessage(error: AppError): string {
  switch (error.kind) {
    case "network":
      return "Network error — check your connection and try again.";
    case "rate_limited":
      return "You've hit today's limit — try again shortly.";
    case "timeout":
      return "The request timed out — try again.";
    case "api_error":
      return error.messages.length > 0
        ? `Data source error: ${error.messages.join("; ")}`
        : "Data source error.";
    case "validation":
      return "Received unexpected data — the source may be temporarily wrong.";
    case "http":
      return `Request failed (HTTP ${error.status}).`;
    case "unknown":
      return "Something went wrong.";
  }
}
