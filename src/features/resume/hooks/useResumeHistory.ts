"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listResumeSeries,
  listResumeVersions,
  setActiveResumeVersion,
  getResumeSignedUrl,
  type ResumeSeriesListResponse,
  type ResumeVersionsResponse,
} from "@/features/resume/api/resumeApi";
import type { ResumeSeries, ResumeVersion } from "@/features/resume/types";

// Query Keys
const SERIES_QK = ["resume", "series"] as const;
const VERSIONS_QK = (sid: string) => ["resume", "versions", sid] as const;

type UseResumeSeriesResult = {
  items: ResumeSeries[];
  loading: boolean;
  error: string | null;

  seriesId: string | null;
  versionId: string | null;

  setSeriesId: (id: string) => void;

  // 点击版本：激活 + 选中 + 刷新
  activateAndSelect: (verId: string) => Promise<void>;

  // 预览：获取签名 URL 并打开
  previewVersion: (p: { fileKey: string; fileName: string }) => Promise<void>;
};

export function useResumeSeries(): UseResumeSeriesResult {
  const qc = useQueryClient();

  /** 1) 系列列表 */
  const seriesQuery = useQuery<ResumeSeriesListResponse>({
    queryKey: SERIES_QK,
    queryFn: listResumeSeries,
    staleTime: 60_000,
  });

  const items: ResumeSeries[] = React.useMemo(
    () => seriesQuery.data?.items ?? [],
    [seriesQuery.data]
  );

  /** 2) 当前 seriesId（默认取第一个） */
  const [seriesId, _setSeriesId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!seriesId && items.length > 0) _setSeriesId(items[0].id);
  }, [items, seriesId]);
  const setSeriesId = React.useCallback((id: string) => _setSeriesId(id || null), []);

  /** 3) 版本列表（稳定 DTO：{ versions, activeVersionId }） */
  const versionsQuery = useQuery<ResumeVersionsResponse>({
    enabled: !!seriesId,
    queryKey: VERSIONS_QK(seriesId ?? "noop"),
    queryFn: async () => listResumeVersions(seriesId as string),
  });

  /** 当前选中 versionId（默认取 active/first） */
  const [versionId, _setVersionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!versionsQuery.data) return;
    const { versions, activeVersionId } = versionsQuery.data;

    // 先取 active，否则取第一条
    const active = activeVersionId
      ? versions.find((v) => v.id === activeVersionId)
      : undefined;

    const fallback = versions?.[0];
    const next = active?.id ?? fallback?.id ?? null;

    // 当 series 切换或列表刷新时，如果现有 versionId 不在列表里，也更新
    if (!versionId || (next && !versions.some((v) => v.id === versionId))) {
      _setVersionId(next);
    }
  }, [versionsQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 4) 激活版本（点击条目） */
  const activateMutation = useMutation({
    mutationFn: async (verId: string) => {
      if (!seriesId) return;
      await setActiveResumeVersion(seriesId, verId);
      _setVersionId(verId);
    },
    onSuccess: async () => {
      if (seriesId) {
        // 刷新 versions 与 series 列表（更新时间/排序等）
        await Promise.all([
          qc.invalidateQueries({ queryKey: VERSIONS_QK(seriesId) }),
          qc.invalidateQueries({ queryKey: SERIES_QK }),
        ]);
      }
    },
  });

  const activateAndSelect = React.useCallback(
    async (verId: string) => {
      await activateMutation.mutateAsync(verId);
    },
    [activateMutation]
  );

  /** 5) 预览（签名 URL） */
  const previewVersion = React.useCallback(
    async ({ fileKey, fileName }: { fileKey: string; fileName: string }) => {
      try {
        const { url } = await getResumeSignedUrl(fileKey, fileName);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        // toast 已由 http.ts 统一处理，这里仅兜底日志
        console.error("preview failed", e);
      }
    },
    []
  );

  /** 6) 错误处理合并 */
  const loading = seriesQuery.isLoading || versionsQuery.isLoading || activateMutation.isPending;
  const error =
    (seriesQuery.error as any)?.message ||
    (versionsQuery.error as any)?.message ||
    (activateMutation.error as any)?.message ||
    null;

  return {
    items,
    loading,
    error,

    seriesId,
    versionId,

    setSeriesId,
    activateAndSelect,
    previewVersion,
  };
}
