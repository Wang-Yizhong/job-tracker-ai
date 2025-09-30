// --- file: src/components/resumes/AnalysisPanel.tsx
"use client";

import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Lightbulb } from "lucide-react";

export type MatchRow = {
  skill: string;
  state: "hit" | "partial" | "miss";
  must?: boolean;
  suggestion?: string;
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
  const total = match?.total ?? 0;
  const covered = match?.covered ?? 0;
  const rows = (match?.rows ?? []).slice(0, pageLimit);
  const missing = rows.filter((r) => r.state !== "hit");
  const suggestions = missing.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <div
        className="
          rounded-3xl border border-border bg-white shadow-sm
          h-[calc(100vh-120px)]   /* 固定高度，减去 header/footer */
          flex flex-col
        "
      >
        {/* header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold">Job-Anforderungen</h3>
          {showBadge && total > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {covered}/{total} Fähigkeiten abgedeckt
            </span>
          )}
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {rows.length ? (
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
                    <span className="text-sm">{r.skill}</span>
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
              Keine Anforderungen erkannt.
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((r, i) => (
                <div
                  key={`${r.skill}-sug-${i}`}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    KI-Vorschlag · {r.skill}
                  </div>
                  <div className="text-sm text-muted">
                    {r.suggestion ||
                      `Füge Details zu deiner Erfahrung mit ${r.skill} hinzu.`}
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
