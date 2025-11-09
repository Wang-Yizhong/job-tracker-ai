"use client";

import * as React from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/common/Skeleton";

export function DashboardSkeleton() {
  return (
    <main className="flex flex-col gap-3 p-4 lg:p-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-border">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-48 mb-3" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col w-2/3 gap-1">
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
