// React Query hook for Dashboard — stable key + Zod validation + refresh helper

import * as React from "react";
import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
  type QueryObserverResult,
} from "@tanstack/react-query";
import { getDashboard, type DashboardQuery } from "../api/dashboardApi";
import {
  DashboardDataSchema,
  type DashboardData,
} from "@/features/dashboard/schemas/dashboard.schema";

// 方便外部拿到完整的 query 能力，同时多一个 refresh()
export type UseDashboardReturn = UseQueryResult<DashboardData, Error> & {
  /** Convenience wrapper for refetch with `cancelRefetch: false`. */
  refresh: () => Promise<QueryObserverResult<DashboardData, Error>>;
};

export function useDashboard(params?: DashboardQuery): UseDashboardReturn {
  const query = useQuery<DashboardData, Error>({
    // ✅ 稳定的 key：不传参时用 null，而不是 {}
    queryKey: ["dashboard", params ?? null] as const,
    queryFn: async () => {
      const raw = await getDashboard(params ?? {});
      // 如果 getDashboard 返回 { data: ... }，改成 parse(raw.data)
      return DashboardDataSchema.parse(raw);
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000, // 仪表盘可允许稍微过期，减少抖动
    retry: false,      // 快速失败，由 UI 处理错误态
  });

  // ✅ 提供一个明确可复用的刷新方法
  const refresh = React.useCallback(() => {
    return query.refetch({ cancelRefetch: false });
  }, [query]);

  return { ...query, refresh };
}
