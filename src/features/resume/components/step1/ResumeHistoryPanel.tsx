// --- file: src/features/resume/components/ResumeHistoryPanel.tsx
"use client";

import * as React from "react";
import { Eye, Loader2, Star } from "lucide-react";
import { useResumeSeries } from "@/features/resume/hooks/useResumeHistory";
import { useResumeStepStore } from "@/features/resume/store/useResumeStepStore";
import type { ResumeSeries, ResumeVersion } from "@/features/resume/types";

type Props = {
  className?: string;
  /** 可选：外部需要拿到当前选中的版本（例如做预览/提示） */
  onPick?: (p: {
    seriesId: string;
    versionId: string;
    fileKey: string;
    fileName: string;
  }) => void;
};

// 安全日期格式化
function formatDate(d?: string | number | Date) {
  if (!d) return "—";
  const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
}

export default function ResumeHistoryPanel({ className = "", onPick }: Props) {
  const {
    items,
    loading,
    error,
    seriesId,
    versionId,
    setSeriesId,
    activateAndSelect,
    previewVersion,
  } = useResumeSeries();

  const setHistorySource = useResumeStepStore((s) => s.setHistorySource);

  const current = React.useMemo<ResumeSeries | null>(
    () => items.find((x) => x.id === seriesId) || null,
    [items, seriesId]
  );

  // 初次或切换系列后，自动把 active 版本回传给上层
  React.useEffect(() => {
    if (!current) return;
    const versions: ResumeVersion[] = current.versions ?? [];
    const active =
      (current.activeVersionId &&
        versions.find((v) => v.id === current.activeVersionId)) ||
      versions[0];

    if (active) {
      onPick?.({
        seriesId: current.id,
        versionId: active.id,
        fileKey: active.fileKey,
        fileName: active.fileName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.activeVersionId, (current?.versions ?? []).length]);

  // 点击某个版本：激活 + 写 Zustand + 写 sessionStorage
  const handleChooseVersion = async (s: ResumeSeries, v: ResumeVersion) => {
    try {
      // 1) 激活后端的 activeVersionId（也会刷新列表）
      await activateAndSelect(v.id);

      // 2) Zustand（让 Step1 的 canAnalyse 立即变 true）
      setHistorySource({
        seriesId: s.id,
        versionId: v.id,
        fileKey: v.fileKey,
        fileName: v.fileName,
      });

      // 3) 持久化到 session（供 /resume/analyse 读取）
      const prev = safeParseSession("resume:pendingAnalyse");
      sessionStorage.setItem(
        "resume:pendingAnalyse",
        JSON.stringify({
          ...prev,
          seriesId: s.id,
          versionId: v.id,
          fileKey: v.fileKey,
          fileName: v.fileName,
        })
      );

      // 4) 可选：回传给父组件
      onPick?.({
        seriesId: s.id,
        versionId: v.id,
        fileKey: v.fileKey,
        fileName: v.fileName,
      });
    } catch (e) {
      // http.ts 已 toast，这里静默
      console.error("activate/select failed", e);
    }
  };

  return (
    <div className={`rounded-3xl border border-border bg-white p-4 shadow-sm ${className}`}>
      {/* 顶部：系列选择 */}
      <div className="mb-3 flex items-center gap-2">
        <select
          value={seriesId ?? ""}
          onChange={(e) => setSeriesId(e.target.value)}
          className="min-w-[220px] rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          {(items.length ? items : []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
              {s.language ? ` (${String(s.language).toUpperCase()})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 错误 / 加载 */}
      {error && (
        <div className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Lädt …
        </div>
      )}

      {/* 版本列表 */}
      <div className="space-y-2">
        {!loading &&
          current &&
          (current.versions ?? []).map((v) => {
            const active = v.id === current.activeVersionId;
            const selected = v.id === versionId;

            return (
              <div
                key={v.id}
                onClick={() => handleChooseVersion(current, v)}
                className={[
                  "cursor-pointer rounded-2xl border px-3 py-3 transition",
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : selected
                    ? "border-border bg-background"
                    : "border-border hover:bg-background",
                ].join(" ")}
                title={active ? "Aktivierte Version" : "Klicken zum Aktivieren"}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{v.fileName}</div>
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <Star className="h-3 w-3" /> Aktiv
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Hochgeladen am {formatDate(v.uploadedAt)}
                    </div>

                    {v.note && (
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {v.note}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVersion({ fileKey: v.fileKey, fileName: v.fileName });
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-background"
                      title="PDF ansehen"
                    >
                      <Eye className="h-4 w-4" />
                      Ansehen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && (!current || (current.versions ?? []).length === 0) && (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Keine Versionen. Lade eine neue Version hoch.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function safeParseSession(key: string): Record<string, any> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
