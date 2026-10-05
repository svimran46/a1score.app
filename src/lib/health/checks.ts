/**
 * src/lib/health/checks.ts
 *
 * Comprehensive Health Probes & Upstream Shape Validation
 * Phase 17: Probes FotMob, Transfermarkt, Database (Supabase), and Cache.
 * Validates actual response shapes (not just HTTP 200) to detect schema drift early.
 */

import { supabase } from "@/lib/supabase";
import { getXMasHeader } from "@/lib/fotmob/client";
import { _getCacheStats } from "@/lib/cache";
import {
  validateFotmobMatches,
  validateTmMarketValueGraph,
  getSchemaDriftStatus,
} from "@/lib/validation/upstream-shapes";

export type HealthStatus = "ok" | "degraded" | "down";

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs: number;
  lastSuccessfulFetch: string | null;
  schemaDrift: boolean;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemHealthSummary {
  status: HealthStatus;
  timestamp: string;
  version: string;
  components: {
    fotmob: HealthStatus;
    transfermarkt: HealthStatus;
    database: HealthStatus;
    cache: HealthStatus;
  };
  checks?: {
    supabase: string;
    fotmob: string;
    transfermarkt?: string;
    database?: string;
    cache?: string;
  };
  fotmob?: {
    ok: boolean;
    latencyMs: number | null;
  };
}

export interface SystemHealthDetail extends SystemHealthSummary {
  componentsDetail: {
    fotmob: ComponentHealth;
    transfermarkt: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
  };
  staleness?: {
    olderThan3d: number;
    olderThan7d: number;
    olderThan14d: number;
    olderThan30d: number;
    olderThan60d: number;
  };
  timings: {
    totalMs: number;
  };
}

// Persistent module-level store tracking last successful fetch timestamps
const lastSuccessTimestamps: Record<string, string> = {
  fotmob: new Date().toISOString(),
  transfermarkt: new Date().toISOString(),
  database: new Date().toISOString(),
  cache: new Date().toISOString(),
};

const FOTMOB_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.fotmob.com/",
};

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

/**
 * Probes FotMob upstream endpoint and validates response shape.
 */
export async function checkFotmobHealth(timeoutMs = 2500): Promise<ComponentHealth> {
  const start = Date.now();
  const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const path = `/api/data/matches?date=${dateFormatted}`;
  const xMas = getXMasHeader(path);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`https://www.fotmob.com${path}`, {
      method: "GET",
      headers: {
        ...FOTMOB_HEADERS,
        "x-mas": xMas,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        status: res.status >= 500 ? "down" : "degraded",
        latencyMs,
        lastSuccessfulFetch: lastSuccessTimestamps.fotmob,
        schemaDrift: false,
        message: `HTTP ${res.status} from FotMob upstream`,
      };
    }

    const json = await res.json();
    const validation = validateFotmobMatches(json, path);

    if (!validation.success) {
      return {
        status: "degraded",
        latencyMs,
        lastSuccessfulFetch: lastSuccessTimestamps.fotmob,
        schemaDrift: true,
        message: `FotMob schema drift detected: ${validation.error}`,
      };
    }

    lastSuccessTimestamps.fotmob = new Date().toISOString();
    return {
      status: latencyMs > 1800 ? "degraded" : "ok",
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.fotmob,
      schemaDrift: false,
      message: latencyMs > 1800 ? "High latency" : "Operational",
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const drift = getSchemaDriftStatus("fotmob");
    return {
      status: "degraded", // Upstream degradation is non-blocking to local a1score app
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.fotmob,
      schemaDrift: Boolean(drift),
      message: err?.name === "AbortError" ? "Timeout probe" : err?.message || "Probe failed",
    };
  }
}

/**
 * Probes Transfermarkt upstream endpoint and validates response shape.
 */
export async function checkTransfermarktHealth(timeoutMs = 2500): Promise<ComponentHealth> {
  const start = Date.now();
  // Probe public CEAPI endpoint for known benchmark player (68290 = Erling Haaland)
  const path = "/ceapi/marketValueDevelopment/graph/68290";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`https://www.transfermarkt.com${path}`, {
      method: "GET",
      headers: {
        ...TM_HEADERS,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        status: res.status >= 500 ? "down" : "degraded",
        latencyMs,
        lastSuccessfulFetch: lastSuccessTimestamps.transfermarkt,
        schemaDrift: false,
        message: `HTTP ${res.status} from Transfermarkt upstream`,
      };
    }

    const json = await res.json();
    const validation = validateTmMarketValueGraph(json, path);

    if (!validation.success) {
      return {
        status: "degraded",
        latencyMs,
        lastSuccessfulFetch: lastSuccessTimestamps.transfermarkt,
        schemaDrift: true,
        message: `Transfermarkt schema drift detected: ${validation.error}`,
      };
    }

    lastSuccessTimestamps.transfermarkt = new Date().toISOString();
    return {
      status: latencyMs > 2000 ? "degraded" : "ok",
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.transfermarkt,
      schemaDrift: false,
      message: latencyMs > 2000 ? "High latency" : "Operational",
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const drift = getSchemaDriftStatus("transfermarkt");
    return {
      status: "degraded",
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.transfermarkt,
      schemaDrift: Boolean(drift),
      message: err?.name === "AbortError" ? "Timeout probe" : err?.message || "Probe failed",
    };
  }
}

/**
 * Probes Database connectivity and query response.
 */
export async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    const isProd = process.env.NODE_ENV === "production";
    return {
      status: isProd ? "down" : "ok",
      latencyMs: 0,
      lastSuccessfulFetch: lastSuccessTimestamps.database,
      schemaDrift: false,
      message: isProd ? "Unconfigured database credentials" : "Local mock database",
    };
  }

  try {
    const { data, error } = await supabase.from("League").select("id").limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      return {
        status: "down",
        latencyMs,
        lastSuccessfulFetch: lastSuccessTimestamps.database,
        schemaDrift: false,
        message: error.message,
      };
    }

    lastSuccessTimestamps.database = new Date().toISOString();
    return {
      status: latencyMs > 1500 ? "degraded" : "ok",
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.database,
      schemaDrift: false,
      message: latencyMs > 1500 ? "High latency" : "Operational",
      details: { rowCount: data ? data.length : 0 },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      status: "down",
      latencyMs,
      lastSuccessfulFetch: lastSuccessTimestamps.database,
      schemaDrift: false,
      message: err?.message || "Database connection error",
    };
  }
}

/**
 * Checks In-Memory & Edge KV Cache state.
 */
export async function checkCacheHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  const stats = _getCacheStats();
  const latencyMs = Date.now() - start;

  lastSuccessTimestamps.cache = new Date().toISOString();
  return {
    status: stats.isOperational ? "ok" : "degraded",
    latencyMs,
    lastSuccessfulFetch: lastSuccessTimestamps.cache,
    schemaDrift: false,
    message: "Operational",
    details: {
      entries: stats.size,
      maxEntries: stats.maxEntries,
      inFlight: stats.inFlightCount,
      oldestEntryAgeSeconds: stats.oldestEntryAgeSeconds,
    },
  };
}

/**
 * Aggregates individual component health states into overall system status.
 *
 * Rules:
 * - "ok": All core components are healthy.
 * - "down": Primary database is down OR multiple critical components failed.
 * - "degraded": At least one upstream (FotMob/Transfermarkt) or Cache is degraded/slow/drifted,
 *   while the app continues serving cached data.
 */
export function aggregateHealthStatus(components: {
  fotmob: HealthStatus;
  transfermarkt: HealthStatus;
  database: HealthStatus;
  cache: HealthStatus;
}): HealthStatus {
  if (components.database === "down") {
    return "down";
  }

  const downCount = Object.values(components).filter((s) => s === "down").length;
  if (downCount >= 2) {
    return "down";
  }

  const degradedCount = Object.values(components).filter(
    (s) => s === "degraded" || s === "down"
  ).length;

  if (degradedCount > 0) {
    return "degraded";
  }

  return "ok";
}

/**
 * Unified entry point for health diagnostics.
 */
export async function getSystemHealth(detailed = false): Promise<SystemHealthSummary | SystemHealthDetail> {
  const totalStart = Date.now();

  const [fotmob, transfermarkt, database, cache] = await Promise.all([
    checkFotmobHealth(),
    checkTransfermarktHealth(),
    checkDatabaseHealth(),
    checkCacheHealth(),
  ]);

  const componentsStatus = {
    fotmob: fotmob.status,
    transfermarkt: transfermarkt.status,
    database: database.status,
    cache: cache.status,
  };

  const overallStatus = aggregateHealthStatus(componentsStatus);
  const now = new Date().toISOString();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

  // Public summary
  const summary: SystemHealthSummary = {
    status: overallStatus,
    timestamp: now,
    version,
    components: componentsStatus,
    checks: {
      supabase: database.status === "ok" ? "ok" : "unreachable",
      fotmob: fotmob.status === "ok" ? "ok" : "degraded",
      transfermarkt: transfermarkt.status === "ok" ? "ok" : "degraded",
      database: database.status === "ok" ? "ok" : "down",
      cache: cache.status,
    },
    fotmob: {
      ok: fotmob.status === "ok",
      latencyMs: fotmob.latencyMs,
    },
  };

  if (!detailed) {
    return summary;
  }

  // Detailed payload for authorized monitor
  const detail: SystemHealthDetail = {
    ...summary,
    componentsDetail: {
      fotmob,
      transfermarkt,
      database,
      cache,
    },
    timings: {
      totalMs: Date.now() - totalStart,
    },
  };

  return detail;
}
