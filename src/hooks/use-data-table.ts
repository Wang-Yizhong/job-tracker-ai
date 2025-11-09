// --- file: src/hooks/use-data-table.ts
"use client";

import * as React from "react";
import { useDebounce } from "./use-debounce";
import type { SortState } from "@/components/ui/common/DataTable";

export interface TableState {
  page: number;
  pageSize: number;
  query: string;
  sort?: string;
}

type AnyFilters = Record<string, unknown>;

type UseDataTableOptions<F extends AnyFilters = {}> = {
  initial?: Partial<TableState>;
  initialFilters?: Partial<F>;
  defaultSort?: string;
  debounceMs?: number;
  resetOn?: Array<"query" | "pageSize" | "sort" | "filters">;
  total?: number;
};

function parseApiSort(s?: string | null): SortState | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  if (t.includes(":")) {
    const [key, dirRaw = "asc"] = t.split(":");
    const order = dirRaw.toLowerCase() === "desc" ? "desc" : "asc";
    return { key, order };
  }
  if (t.startsWith("-") || t.startsWith("+")) {
    const key = t.slice(1);
    const order = t.startsWith("-") ? "desc" : "asc";
    return { key, order };
  }
  if (t.includes(" ")) {
    const [key, dirRaw = "asc"] = t.split(/\s+/);
    const order = dirRaw.toLowerCase() === "desc" ? "desc" : "asc";
    return { key, order };
  }
  return { key: t, order: "asc" };
}

function toApiSort(state: SortState | null | undefined): string | "" {
  if (!state || !state.key || !state.order) return "";
  return `${state.key}:${state.order}`;
}

export function useDataTable<F extends AnyFilters = {}>(opts?: UseDataTableOptions<F>) {
  const {
    initial,
    initialFilters,
    defaultSort = "createdAt:desc",
    debounceMs = 300,
    resetOn = ["query", "pageSize", "sort", "filters"],
    total = 0,
  } = opts || {};

  const [page, setPage] = React.useState(initial?.page ?? 1);
  const [pageSize, setPageSize] = React.useState(initial?.pageSize ?? 20);
  const [query, setQuery] = React.useState(initial?.query ?? "");
  const [sort, setSort] = React.useState<string>(initial?.sort ?? defaultSort);
  const [filters, setFilters] = React.useState<Partial<F>>((initialFilters ?? {}) as Partial<F>);

  const [tableSort, setTableSort] = React.useState<SortState | null>(
    parseApiSort(initial?.sort ?? defaultSort)
  );

  const debouncedQuery = useDebounce(query, debounceMs);

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const goToPage = React.useCallback(
    (p: number) => {
      const np = Math.min(Math.max(1, p), totalPages);
      if (np !== page) setPage(np);
    },
    [page, totalPages]
  );

  const nextPage = React.useCallback(() => {
    if (!isLast) setPage((p) => p + 1);
  }, [isLast]);

  const prevPage = React.useCallback(() => {
    if (!isFirst) setPage((p) => Math.max(1, p - 1));
  }, [isFirst]);

  const resetPage = React.useCallback(() => setPage(1), []);

  const toggleSort = React.useCallback(
    (key: string) => {
      setSort((prev) => {
        const current = parseApiSort(prev);
        const isSameKey = current?.key === key;
        const nextState: SortState = isSameKey
          ? { key, order: current?.order === "asc" ? "desc" : "asc" }
          : { key, order: "asc" };
        setTableSort(nextState);
        return toApiSort(nextState);
      });
      if (resetOn.includes("sort")) setPage(1);
    },
    [resetOn]
  );

  const onTableSort = React.useCallback(
    (next: SortState) => {
      if (!next.order) {
        setTableSort(parseApiSort(defaultSort));
        setSort(defaultSort);
        if (resetOn.includes("sort")) setPage(1);
        return;
      }
      setTableSort(next);
      setSort(toApiSort(next));
      if (resetOn.includes("sort")) setPage(1);
    },
    [defaultSort, resetOn]
  );

  React.useEffect(() => {
    if (resetOn.includes("query")) setPage(1);
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (resetOn.includes("pageSize")) setPage(1);
  }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const tp = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    if (page > tp) setPage(tp);
  }, [total, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const apiParams = React.useMemo(
    () => ({
      page,
      pageSize,
      query: debouncedQuery,
      sort,
      ...filters,
    }),
    [page, pageSize, debouncedQuery, sort, filters]
  );

  const table = React.useMemo(
    () => ({
      sort: tableSort,
      onSort: onTableSort,
    }),
    [tableSort, onTableSort]
  );

  const pagination = React.useMemo(
    () => ({
      page,
      pageSize,
      total,
      totalPages,
      isFirst,
      isLast,
      setPage,
      setPageSize,
      nextPage,
      prevPage,
      goToPage,
      resetPage,
    }),
    [page, pageSize, total, totalPages, isFirst, isLast, nextPage, prevPage, goToPage, resetPage]
  );

  // Common bindings for UI components
  const bindSearch = React.useMemo(
    () => ({
      value: query,
      onChange: setQuery,
    }),
    [query]
  );

  const bindSelect = React.useCallback(
    <K extends keyof F>(key: K) => ({
      value: filters[key],
      onChange: (v: F[K]) => {
        setFilters((f) => ({ ...f, [key]: v }));
        if (resetOn.includes("filters")) setPage(1);
      },
    }),
    [filters, resetOn]
  );

  return {
    apiParams,
    page,
    pageSize,
    query,
    sort,
    filters,
    setFilters,
    setPage,
    setPageSize,
    setQuery,
    setSort,
    nextPage,
    prevPage,
    resetPage,
    toggleSort,
    table,
    pagination,
    bindSearch,
    bindSelect,
  };
}
