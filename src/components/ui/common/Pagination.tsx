"use client";

import * as React from "react";

export interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  disabled?: boolean;
  pageSizeOptions?: number[];
  className?: string;
  showSummary?: boolean;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled,
  pageSizeOptions = [20, 30, 50],
  className,
  showSummary = true,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  React.useEffect(() => {
    const tp = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    if (page > tp) onPageChange(tp);
  }, [total, pageSize]); // keep stable

  const goto = React.useCallback(
    (p: number) => {
      const np = Math.min(Math.max(1, p), totalPages);
      if (np !== page) onPageChange(np);
    },
    [page, totalPages, onPageChange]
  );

  const options = React.useMemo(
    () => Array.from(new Set([...pageSizeOptions, pageSize])).sort((a, b) => a - b),
    [pageSizeOptions, pageSize]
  );

  return (
    <div
      role="navigation"
      aria-label="Pagination"
      className={
        "sticky bottom-0 z-10 border-t border-border bg-white/95 px-3 py-3 text-sm backdrop-blur " +
        (className ?? "")
      }
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
        {showSummary && (
          <div className="text-muted" aria-live="polite">
            {`Gesamt ${total} · Seite ${page} / ${totalPages}`}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            aria-label="Erste Seite"
            onClick={() => goto(1)}
            disabled={isFirst || disabled}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
          >
            «
          </button>
          <button
            aria-label="Vorherige Seite"
            onClick={() => goto(page - 1)}
            disabled={isFirst || disabled}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Zurück
          </button>

          <span className="select-none px-2 tabular-nums">
            {page} / {totalPages}
          </span>

          <button
            aria-label="Nächste Seite"
            onClick={() => goto(page + 1)}
            disabled={isLast || disabled}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Weiter
          </button>
          <button
            aria-label="Letzte Seite"
            onClick={() => goto(totalPages)}
            disabled={isLast || disabled}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
          >
            »
          </button>

          {onPageSizeChange && (
            <label className="flex items-center gap-2">
              <span className="text-muted">Pro Seite</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                disabled={disabled}
                className="rounded-xl border border-border px-2 py-1.5"
                aria-label="Einträge pro Seite"
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
