"use client";

import React from "react";
import { Skeleton } from "@/components/ui";

export function OverviewSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Events Skeleton */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Info Box Skeleton */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <Skeleton className="h-4 w-32 pb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LineupsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Team switcher skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2 min-h-[44px]">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2 min-h-[44px]">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Tactical pitch skeleton */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl bg-[var(--bg-chip)] flex items-center justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <Skeleton className="h-4 w-44" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-2xl bg-[var(--bg-elevated)] space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1 max-w-sm" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function H2HSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-4">
        <Skeleton className="h-4 w-40 pb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} className="w-6 h-6 rounded-full" />
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} className="w-6 h-6 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
