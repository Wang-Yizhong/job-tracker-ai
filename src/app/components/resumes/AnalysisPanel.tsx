// --- file: src/components/resumes/AnalysisPanel.tsx
"use client";

import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Lightbulb } from "lucide-react";

export type MatchRow = {
  skill: string;
  state: "hit" | "partial" | "miss";
  must?: boolean;
  suggestion?: string | null;
};

export type MatchMatrix = {
  total: number;
  covered: number;
  rows: MatchRow[];
};

type Props = {
  match?: MatchMatrix | null;
  onNext?: () => void;
  /** Start Q&A */
  onStartQA?: () => void;
  pageLimit?: number;
  showBadge?: boolean;
};

export default function AnalysisPanel({
  match,
  onNext,
  onStartQA,
  pageLimit = 14,
  showBadge = true,
}: Props) {
  const safeRows: MatchRow[] = Array.isArray(match?.rows) ? match!.rows : [];
  console.log(match,)
  const total = typeof match?.total === "number" ? match!.total : safeRows.length;
  const covered = typeof match?.covered === "number"
    ? match!.covered
    : safeRows.filter((r) => r.state === "hit").length;

  // 页面渲染列表（受 pageLimit 控制）
  const rows = safeRows.slice(0, Math.max(0, pageLimit));
  const missing = rows.filter((r) => r.state !== "hit");
  const suggestions = missing.slice(0, 2);

  const nothingToShow = rows.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <div
        className="
          rounded-3xl border border-border bg-white shadow-sm
          h-[calc(100vh-120px)]
          flex flex-col
        "
      >
        {/* header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold text-foreground">Job-Anforderungen</h3>
          {showBadge && total > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {covered}/{total} Fähigkeiten abgedeckt
            </span>
          )}
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 主列表 */}
          {rows.length > 0 ? (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div
                  key={`${r.skill}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {r.state === "hit" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : r.state === "partial" ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="text-sm text-foreground">{r.skill}</span>
                  </div>
                  {r.must && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                      Pflicht
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
              {/* 更智能的空态：如果 total>0，但 rows 为空，说明被 pageLimit 或切片影响；展示前 5 条原始数据以辅助排查 */}
              {total > 0 && safeRows.length > 0 ? (
                <div className="space-y-2">
                  <div className="mb-2 text-foreground">
                    Es gibt <b>{total}</b> Anforderungen, aber die aktuelle Ansicht zeigt 0 Einträge.
                    Prüfe bitte <code>pageLimit</code> 或过滤条件。
                  </div>
                  {safeRows.slice(0, 5).map((r, i) => (
                    <div
                      key={`fallback-${i}-${r.skill}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {r.state === "hit" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : r.state === "partial" ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="text-sm text-foreground">{r.skill}</span>
                      </div>
                      {r.must && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                          Pflicht
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-muted">
                    提示：你可以尝试提高 <code>pageLimit</code> 或检查父组件传参。
                  </div>
                </div>
              ) : (
                <>Keine Anforderungen erkannt.</>
              )}
            </div>
          )}

          {/* 建议区 */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((r, i) => (
                <div
                  key={`${r.skill}-sug-${i}`}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    KI-Vorschlag · {r.skill}
                  </div>
                  <div className="text-sm text-muted">
                    {r.suggestion || `Füge Details zu deiner Erfahrung mit ${r.skill} hinzu.`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 p-4">
          {onStartQA && (
            <button
              onClick={onStartQA}
              className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
            >
              Fragen zu fehlenden Fähigkeiten
            </button>
          )}
          <button
            onClick={onNext}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95 active:opacity-90"
          >
            Weiter · Lebenslauf bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
}
