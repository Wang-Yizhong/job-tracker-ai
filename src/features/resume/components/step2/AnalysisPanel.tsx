// --- file: src/features/resume/components/step2/AnalysisPanel.tsx
"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { MatchMatrix } from "@/features/resume/types";

type Props = {
  match?: MatchMatrix | null;
  pageLimit?: number;
  showBadge?: boolean;
  onNext?: () => void;
  onStartQA?: () => void;
};

// 将各种后端返回格式归一化
function normalizeRow(r: any) {
  if (!r || typeof r !== "object") {
    return {
      text: "—",
      must: false,
      isHit: false,
      suggestion: undefined,
      raw: r,
    };
  }

  // 新版（你当前的接口）
  const hasFlat = "skill" in r || "matched" in r || "suggestion" in r;
  if (hasFlat) {
    const text = r.skill ?? r.text ?? "—";
    const must = !!r.must;
    const state = r.state as string | undefined; // "hit" | "partial" | ...
    const matched = !!r.matched;
    // 命中规则：matched=true 或 state==='hit' / 'full'
    const isHit =
      matched ||
      state === "hit" ||
      state === "full" ||
      state === "matched" ||
      state === "ok";
    const suggestion = r.suggestion ?? r.reason;
    return { text, must, isHit, suggestion, raw: r };
  }

  // 旧版（req.text / req.must / reason）
  const text = r?.req?.text ?? "—";
  const must = !!r?.req?.must;
  const state = r?.state as string | undefined;
  const isHit =
    state === "hit" || state === "full" || state === "matched" || state === "ok";
  const suggestion = r?.reason;
  return { text, must, isHit, suggestion, raw: r };
}

export default function AnalysisPanel({
  match,
  pageLimit = 14,
  showBadge = true,
  onNext,
  onStartQA,
}: Props) {
  // 安全行数据
  const safeRows = React.useMemo(() => {
    const arr = Array.isArray(match?.rows) ? match!.rows : [];
    return arr.map(normalizeRow);
  }, [match]);

  // 顶部统计（优先使用后端的 total/covered）
  const total =
    typeof match?.total === "number" ? match!.total : safeRows.length;
  const covered =
    typeof match?.covered === "number"
      ? match!.covered
      : safeRows.filter((r) => r.isHit).length;

  // 当前页渲染
  const rows = safeRows.slice(0, Math.max(0, pageLimit));
  const missing = rows.filter((r) => !r.isHit);

  // 取两条建议，优先使用接口给的 suggestion
  const suggestions = missing.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <div className="rounded-3xl border border-border bg-white shadow-sm h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold text-foreground">Job-Anforderungen</h3>
          {showBadge && total > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {covered}/{total} Fähigkeiten abgedeckt
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {rows.length > 0 ? (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div
                  key={`${r.text}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {r.isHit ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="text-sm text-foreground">{r.text}</span>
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
              {total > 0 && safeRows.length > 0 ? (
                <div className="space-y-2">
                  <div className="mb-2 text-foreground">
                    Es gibt <b>{total}</b> Anforderungen, aber die aktuelle Ansicht zeigt 0 Einträge.
                    Prüfe bitte <code>pageLimit</code>.
                  </div>
                  {safeRows.slice(0, 5).map((r, i) => (
                    <div
                      key={`fallback-${i}-${r.text}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {r.isHit ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="text-sm text-foreground">{r.text}</span>
                      </div>
                      {r.must && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                          Pflicht
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-muted">
                    Tipp: erhöhe <code>pageLimit</code>.
                  </div>
                </div>
              ) : (
                <>Keine Anforderungen erkannt.</>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((r, i) => {
                const text =
                  r.suggestion ??
                  (r.text !== "—"
                    ? `Füge Details zu deiner Erfahrung mit ${r.text} hinzu.`
                    : "Füge konkrete, messbare Ergebnisse hinzu.");
                return (
                  <div
                    key={`${r.text}-sug-${i}`}
                    className="rounded-2xl border border-border bg-background px-4 py-3"
                  >
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lightbulb className="h-4 w-4" />
                      KI-Vorschlag · {r.text}
                    </div>
                    <div className="text-sm text-muted">{text}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
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
