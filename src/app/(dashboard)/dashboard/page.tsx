"use client";

import * as React from "react";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import StatCards from "@/features/dashboard/components/StatCards";
import StatusChart from "@/features/dashboard/components/StatusChart";
import TrendChart from "@/features/dashboard/components/TrendChart";
import RecentJobs from "@/features/dashboard/components/RecentJobs";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

export default function DashboardClient() {
  // ✅ 所有 hook 都放在顶层
  const { data, isLoading, isFetching, error, refetch } = useDashboard();

  // ✅ useCallback 提前定义
  const handleRefresh = React.useCallback(() => {
    refetch({ cancelRefetch: false });
  }, [refetch]);

  // ✅ 逻辑分支在所有 hook 之后
  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-4 text-rose-600">
        Fehler beim Laden.
        <button
          onClick={() => refetch({ cancelRefetch: false })}
          className="ml-2 rounded bg-secondary px-2.5 py-1 text-white text-sm"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="flex flex-col gap-3 p-4 lg:p-5">
      <DashboardHeader onRefresh={handleRefresh} refreshing={isFetching} />
      <StatCards stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StatusChart data={data.statusDistribution} />
        <TrendChart data={data.trend} />
      </div>

      <RecentJobs list={data.recentJobs} />
    </main>
  );
}
