"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  Server,
  Database,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { SystemHealthSummary, HealthStatus } from "@/lib/health/checks";

interface StatusDashboardProps {
  initialData: SystemHealthSummary;
}

export function StatusDashboard({ initialData }: StatusDashboardProps) {
  const [health, setHealth] = useState<SystemHealthSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date(initialData.timestamp));

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data: SystemHealthSummary = await res.json();
        setHealth(data);
        setLastRefreshedAt(new Date(data.timestamp));
      }
    } catch (err) {
      console.error("Failed to refresh health status", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      refreshStatus();
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case "ok":
        return {
          label: "OPERATIONAL",
          icon: <CheckCircle2 className="w-4 h-4 text-[var(--trend-up)]" aria-hidden="true" />,
          bgColor: "bg-[var(--bg-chip)]",
          textColor: "text-[var(--text-primary)]",
          badgeBorder: "border-[var(--divider)]",
          description: "Operating within normal parameters",
        };
      case "degraded":
        return {
          label: "DEGRADED",
          icon: <AlertTriangle className="w-4 h-4 text-[var(--value-text)]" aria-hidden="true" />,
          bgColor: "bg-[var(--bg-chip)]",
          textColor: "text-[var(--value-text)]",
          badgeBorder: "border-[var(--value-text)]",
          description: "Elevated latency or schema drift; served via stale-while-revalidate fallback",
        };
      case "down":
        return {
          label: "OUTAGE",
          icon: <XCircle className="w-4 h-4 text-[var(--trend-down)]" aria-hidden="true" />,
          bgColor: "bg-[var(--bg-chip)]",
          textColor: "text-[var(--trend-down)]",
          badgeBorder: "border-[var(--trend-down)]",
          description: "Service unreachable; active automated recovery in progress",
        };
    }
  };

  const overall = getStatusBadge(health.status);

  const componentsList = [
    {
      id: "fotmob",
      name: "FotMob Match Engine",
      category: "Match Scores & Lineups",
      status: health.components.fotmob,
      icon: <Activity className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />,
      description: "Direct upstream proxy providing match scores, lineups, player ratings, and timeline events.",
      sla: "5-second edge cache with automatic anti-bot signature reconciliation",
    },
    {
      id: "transfermarkt",
      name: "Transfermarkt Market Intelligence",
      category: "Player Valuations & Transfers",
      status: health.components.transfermarkt,
      icon: <Server className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />,
      description: "Direct valuation proxy extracting player market curves, transfer histories, and squad valuations.",
      sla: "Hourly revalidation with strict runtime Zod schema boundary validation",
    },
    {
      id: "database",
      name: "Supabase PostgreSQL Database",
      category: "Persistent Relational Storage",
      status: health.components.database,
      icon: <Database className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />,
      description: "Database storing clubs, players, leagues, user watchlists, and immutable valuation snapshots.",
      sla: "Row-Level Security (RLS) enabled with read-optimized indexed replicas",
    },
    {
      id: "cache",
      name: "Memory Cache Subsystem",
      category: "Edge Performance Acceleration",
      status: health.components.cache,
      icon: <Layers className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />,
      description: "In-memory LRU cache storing warmed fixtures, valuations, and standings to ensure low TTFB.",
      sla: "Sub-millisecond access time with automatic staleness eviction",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <Card className="border border-[var(--divider)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-[var(--bg-chip)] border border-[var(--divider)] shrink-0 mt-0.5">
              {overall.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {health.status === "ok" && "All Systems Operational"}
                  {health.status === "degraded" && "Partial System Degradation"}
                  {health.status === "down" && "Major Service Outage"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${overall.badgeBorder} ${overall.textColor} ${overall.bgColor}`}
                  role="status"
                  aria-label={`Overall status: ${overall.label}`}
                >
                  {overall.icon}
                  <span>{overall.label}</span>
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">{overall.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="text-xs text-[var(--text-muted)] text-right hidden sm:block">
              <div>Auto-refreshes every 60s</div>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>Checked {lastRefreshedAt.toLocaleTimeString()}</span>
              </div>
            </div>
            <Chip
              onClick={refreshStatus}
              disabled={isRefreshing}
              aria-label="Refresh status checks"
              icon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              }
            >
              {isRefreshing ? "Probing..." : "Refresh"}
            </Chip>
          </div>
        </div>
      </Card>

      {/* Component Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">System Components</h3>
          <span className="text-xs text-[var(--text-muted)]">
            4 of 4 probes monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {componentsList.map((comp) => {
            const badge = getStatusBadge(comp.status);
            return (
              <Card
                key={comp.id}
                className="border border-[var(--divider)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[var(--bg-chip)] border border-[var(--divider)]">
                        {comp.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                          {comp.name}
                        </h4>
                        <span className="text-xs text-[var(--text-muted)]">{comp.category}</span>
                      </div>
                    </div>

                    {/* Explicit Accessible Status Badge - Never color alone */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badge.badgeBorder} ${badge.textColor} ${badge.bgColor}`}
                      role="status"
                      aria-label={`${comp.name} status: ${badge.label}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--divider)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="truncate max-w-[220px] sm:max-w-none">{comp.sla}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>Active</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Incident & Staleness Policy Notice */}
      <Card className="border border-[var(--divider)] bg-[var(--bg-card)]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--bg-chip)] shrink-0 mt-0.5">
            <Activity className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Data Freshness & Degradation Policy
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              a1score protects against silent scraper failures. When FotMob or Transfermarkt upstream APIs undergo unexpected schema changes or rate limits, the runtime Zod boundary validator intercepts the malformed payload, logs the schema drift, and falls back to cached verified values. Match feeds older than 5 minutes and valuations older than 30 days clearly display a visible &quot;Review pending&quot; or staleness timestamp in the UI.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
