// src/components/ui/DataTable.tsx
import * as React from "react";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export type SortState = {
  key: string;
  order: "asc" | "desc" | null;
};

export type ColumnDef<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  width?: number;
  pin?: "left" | "right";
  align?: "left" | "center" | "right";
  truncate?: boolean;
  className?: string;
};

export type DataTableVariant = "default" | "compact" | "borderless" | "striped";

export type DataTableProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T, index: number) => string;
  sort?: SortState | null;
  onSort?: (next: SortState) => void;
  onRowAction?: (type: string, row: T) => void;
  variant?: DataTableVariant;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  stickyHeader?: boolean;
  stickyHeaderOffset?: number;
  stickyShadow?: "auto" | "none";
  pinShadow?: boolean;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
};

function alignClass(a?: "left" | "center" | "right") {
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}

function usePinnedOffsets<T>(columns: ColumnDef<T>[]) {
  const leftOffsets: Array<number | undefined> = [];
  let accLeft = 0;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].pin === "left") {
      leftOffsets[i] = accLeft;
      if (typeof columns[i].width === "number") accLeft += columns[i].width!;
    }
  }

  const rightOffsets: Array<number | undefined> = [];
  let accRight = 0;
  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].pin === "right") {
      rightOffsets[i] = accRight;
      if (typeof columns[i].width === "number") accRight += columns[i].width!;
    }
  }

  return { leftOffsets, rightOffsets };
}

const variantBase = {
  table: "w-full border-separate border-spacing-0 rounded-xl bg-white shadow-sm overflow-hidden",
  thead: "bg-[#F4F6FB] text-foreground text-sm font-medium",
  row: "h-12",
};

const variants: Record<DataTableVariant, { table: string; thead: string; row: string }> = {
  default: variantBase,
  compact: { ...variantBase, thead: "bg-[#F4F6FB] text-foreground text-xs font-medium", row: "h-10" },
  borderless: { table: "w-full border-separate border-spacing-0 bg-white", thead: variantBase.thead, row: variantBase.row },
  striped: { ...variantBase, row: "h-12 odd:bg-white even:bg-muted/10" },
};

function SortIcon({ order }: { order: "asc" | "desc" | null | undefined }) {
  const base = "inline-block h-3.5 w-3.5 transition-transform duration-150 align-middle ml-1";
  if (!order)
    return (
      <svg viewBox="0 0 20 20" className={cn(base, "text-muted-foreground")}>
        <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  if (order === "asc")
    return (
      <svg viewBox="0 0 20 20" className={cn(base, "rotate-180 text-[#5048E5]")}>
        <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" className={cn(base, "text-[#5048E5]")}>
      <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  sort,
  onSort,
  onRowAction,
  variant = "default",
  className,
  headerClassName,
  rowClassName,
  stickyHeader = true,
  stickyHeaderOffset = 0,
  stickyShadow = "auto",
  pinShadow = true,
  loading = false,
  error = null,
  emptyText = "No data",
}: DataTableProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const { leftOffsets, rightOffsets } = usePinnedOffsets(columns);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrollLeft(el.scrollLeft);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleSort = (col: ColumnDef<T>) => {
    if (!onSort || !col.sortable) return;
    const key = col.sortKey ?? col.key;
    const prev = sort?.key === key ? sort?.order : null;
    const next = prev === null ? "asc" : prev === "asc" ? "desc" : null;
    onSort({ key, order: next });
  };

  const stickyHeaderShadowClass =
    stickyShadow === "auto"
      ? "after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[1px] after:bg-border/70"
      : "";

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto rounded-xl border border-border/60 bg-white", className)}
    >
      {pinShadow && scrollLeft > 0 && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-4 bg-gradient-to-r from-black/5 to-transparent" />
      )}
      {pinShadow && canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-black/5 to-transparent" />
      )}

      <table
        className={cn(
          variants[variant].table,
          "text-sm text-foreground",
          "[&_tbody_tr]:divide-y [&_tbody_tr]:divide-border/40 [&_tbody_tr:hover]:bg-muted/10"
        )}
      >
        <thead
          className={cn(
            variants[variant].thead,
            stickyHeader && "sticky z-10",
            stickyHeader && "top-0",
            stickyHeaderShadowClass,
            headerClassName
          )}
          style={
            stickyHeader && stickyHeaderOffset
              ? ({ top: stickyHeaderOffset } as React.CSSProperties)
              : undefined
          }
        >
          <tr className="border-b border-border/50">
            {columns.map((col, i) => {
              const isActive = sort?.key === (col.sortKey ?? col.key) && sort?.order;
              const isPinnedLeft = col.pin === "left";
              const isPinnedRight = col.pin === "right";
              return (
                <th
                  key={col.key}
                  aria-sort={
                    (isActive === "asc"
                      ? "ascending"
                      : isActive === "desc"
                      ? "descending"
                      : "none") as React.AriaAttributes["aria-sort"]
                  }
                  className={cn(
                    "whitespace-nowrap px-4 py-3 font-medium",
                    alignClass(col.align),
                    isPinnedLeft && "sticky left-0 z-20 bg-[#F4F6FB]",
                    isPinnedRight && "sticky right-0 z-20 bg-[#F4F6FB]",
                    col.className
                  )}
                  style={{
                    width: typeof col.width === "number" ? `${col.width}px` : undefined,
                    left: isPinnedLeft ? (leftOffsets[i] ?? 0) : undefined,
                    right: isPinnedRight ? (rightOffsets[i] ?? 0) : undefined,
                  }}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.sortable ? "cursor-pointer select-none" : "cursor-default"
                    )}
                    onClick={() => handleSort(col)}
                    disabled={!col.sortable}
                    aria-disabled={!col.sortable}
                  >
                    <span>{col.header}</span>
                    {col.sortable && <SortIcon order={isActive ? sort?.order : null} />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="bg-white">
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-red-500">
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            rows.map((row, rIdx) => {
              const id = getRowId(row, rIdx);
              return (
                <tr key={id} className={cn(variants[variant].row, rowClassName)}>
                  {columns.map((col, i) => {
                    const isPinnedLeft = col.pin === "left";
                    const isPinnedRight = col.pin === "right";
                    return (
                      <td
                        key={`${id}-${col.key}`}
                        className={cn(
                          "px-4",
                          alignClass(col.align),
                          col.truncate && "max-w-[1px] truncate",
                          isPinnedLeft && "sticky left-0 z-10 bg-white",
                          isPinnedRight && "sticky right-0 z-10 bg-white",
                          col.className
                        )}
                        style={{
                          width: typeof col.width === "number" ? `${col.width}px` : undefined,
                          left: isPinnedLeft ? (leftOffsets[i] ?? 0) : undefined,
                          right: isPinnedRight ? (rightOffsets[i] ?? 0) : undefined,
                        }}
                      >
                        {col.cell(row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
