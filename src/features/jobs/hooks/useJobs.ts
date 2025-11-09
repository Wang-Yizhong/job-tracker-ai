import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { listJobs, createJob, updateJob, deleteJob } from "../api/jobsApi";
import type { Job, JobsQueryParams } from "../types";

export function useJobs(params: JobsQueryParams) {
  const qc = useQueryClient();

  // 列表查询（v5：placeholderData: keepPreviousData）
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jobs", params] as const,
    queryFn: () => listJobs(params),
    placeholderData: keepPreviousData,
  });

  const rows: Job[] = data?.data ?? [];
  const total: number = (data as any)?.total ?? 0; // 兼容你当前后端结构

  // 创建
  const createMutation = useMutation({
    mutationFn: (payload: Omit<Job, "id">) => createJob(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  // 更新
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; patch: Partial<Job> }) =>
      updateJob(vars.id, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return {
    // 列表数据
    rows,
    total,
    loading: isLoading,
    error: isError ? (error as Error)?.message ?? "Fetch error" : null,
    refetch,

    // 变更操作
    createJob: createMutation.mutateAsync,
    updateJob: (id: string, patch: Partial<Job>) =>
      updateMutation.mutateAsync({ id, patch }),
    deleteJob: deleteMutation.mutateAsync,

    // 状态
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
