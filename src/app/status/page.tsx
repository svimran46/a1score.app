import React from "react";
import type { Metadata } from "next";
import { getSystemHealth, SystemHealthSummary } from "@/lib/health/checks";
import { StatusDashboard } from "./StatusDashboard";

export const metadata: Metadata = {
  title: "System Status",
  description: "Live operational status of a1score services, upstream data sources, and infrastructure.",
};

export const revalidate = 30; // ISR 30s cache

export default async function StatusPage() {
  let initialHealth: SystemHealthSummary;

  try {
    const health = await getSystemHealth(false);
    initialHealth = health as SystemHealthSummary;
  } catch (err) {
    console.error("Failed to load initial system health for status page:", err);
    initialHealth = {
      status: "degraded",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      components: {
        fotmob: "degraded",
        transfermarkt: "degraded",
        database: "ok",
        cache: "ok",
      },
    };
  }

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            System Status
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl">
            Automated health monitoring of upstream APIs, data pipelines, PostgreSQL persistence, and memory caching layers.
          </p>
        </div>

        <StatusDashboard initialData={initialHealth} />
      </div>
    </main>
  );
}
