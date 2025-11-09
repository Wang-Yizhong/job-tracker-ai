// --- file: src/features/user/hooks/useUserInfo.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserInfo } from "@/features/user/api/userApi";
import type { UserInfo } from "@/features/user/types";

/** 只读：获取当前用户信息 */
export function useUserInfo() {
  const { data, isLoading, isError, error, refetch } = useQuery<UserInfo>({
    queryKey: ["userInfo"],
    queryFn: fetchUserInfo,
    staleTime: 60_000,
  });

  return {
    user: data ?? null,
    loading: isLoading,
    error: isError ? (error as Error)?.message ?? "Fetch error" : null,
    refetch,
  };
}
